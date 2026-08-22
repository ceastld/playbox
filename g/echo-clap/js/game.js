(() => {
  "use strict";

  const TAU = Math.PI * 2;
  const STEP = 1 / 60;
  const LIVES = 3;
  const MUTE_KEY = "echo-clap-mute";
  const PINK = "#ff3db8";
  const CYAN = "#00f0ff";
  const GOLD = "#ffe36b";
  const N = 0;
  const E = 1;
  const S = 2;
  const WEST = 3;
  const WALL_NAME = ["北", "东", "南", "西"];

  function beat(at, wall, ghost) {
    return { at: at, wall: wall, ghost: !!ghost };
  }

  const STAGES = [
    {
      name: "初响",
      sub: "FIRST",
      hint: "青浪贴上掌心再拍",
      toast: "等浪落到内环",
      travel: 2.2,
      window: 0.32,
      perfect: 0.13,
      hits: [beat(2.9, N)]
    },
    {
      name: "回廊",
      sub: "HALL",
      hint: "三拍回声，节奏均匀",
      toast: "同一面墙，三记回声",
      travel: 1.88,
      window: 0.24,
      perfect: 0.1,
      hits: [beat(2.45, N), beat(3.8, N), beat(5.15, N)]
    },
    {
      name: "对墙",
      sub: "PAIR",
      hint: "南北对拍，看浪从哪来",
      toast: "对面的墙也会回",
      travel: 1.74,
      window: 0.22,
      perfect: 0.1,
      hits: [beat(2.2, N), beat(3.5, S), beat(4.8, N), beat(6.1, S)]
    },
    {
      name: "四壁",
      sub: "QUAD",
      hint: "四面墙轮流把浪推来",
      toast: "绕室一圈",
      travel: 1.62,
      window: 0.2,
      perfect: 0.09,
      hits: [beat(2.05, N), beat(3.25, E), beat(4.45, S), beat(5.65, WEST)]
    },
    {
      name: "快回",
      sub: "SNAP",
      hint: "更快更紧，贴环再拍",
      toast: "窗口收短了",
      travel: 1.36,
      window: 0.17,
      perfect: 0.075,
      hits: [beat(1.85, N), beat(2.72, E), beat(3.58, N), beat(4.44, WEST), beat(5.3, S), beat(6.16, E)]
    },
    {
      name: "虚响",
      sub: "GHOST",
      hint: "品红是虚响 · 放过别拍",
      toast: "品红虚响，别拍手",
      travel: 1.55,
      window: 0.2,
      perfect: 0.09,
      hits: [
        beat(2.1, N),
        beat(3.05, E, true),
        beat(4.0, S),
        beat(4.95, WEST, true),
        beat(5.9, N),
        beat(6.85, E),
        beat(7.8, S, true)
      ]
    },
    {
      name: "密拍",
      sub: "DENSE",
      hint: "连拍要紧，一浪一掌",
      toast: "密浪来了",
      travel: 1.28,
      window: 0.15,
      perfect: 0.07,
      hits: [
        beat(1.72, N),
        beat(2.26, N),
        beat(2.8, E),
        beat(3.34, E),
        beat(3.88, S),
        beat(4.42, S),
        beat(4.96, WEST),
        beat(5.5, WEST)
      ]
    },
    {
      name: "交错",
      sub: "CROSS",
      hint: "两面墙几乎同时推浪，连拍两记",
      toast: "对向交错 · 连拍",
      travel: 1.42,
      window: 0.155,
      perfect: 0.07,
      hits: [
        beat(2.05, N),
        beat(2.28, S),
        beat(3.5, E),
        beat(3.73, WEST),
        beat(4.95, N),
        beat(5.18, E),
        beat(6.4, S),
        beat(6.63, WEST)
      ]
    },
    {
      name: "暗室",
      sub: "DARK",
      hint: "浪很暗，贴环才亮",
      toast: "暗浪近了才看得见",
      travel: 1.5,
      window: 0.15,
      perfect: 0.065,
      dark: true,
      hits: [
        beat(2.05, N),
        beat(3.0, E, true),
        beat(3.95, WEST),
        beat(4.9, S),
        beat(5.85, N),
        beat(6.8, E),
        beat(7.5, S, true),
        beat(8.4, WEST)
      ]
    },
    {
      name: "满堂",
      sub: "STORM",
      hint: "满堂回声 · 虚实交错",
      toast: "最后一室 · 满堂",
      travel: 1.16,
      window: 0.13,
      perfect: 0.058,
      dark: true,
      hits: [
        beat(1.55, N),
        beat(2.08, S),
        beat(2.6, E, true),
        beat(2.84, WEST),
        beat(3.55, N),
        beat(3.76, S),
        beat(4.5, E),
        beat(5.05, WEST, true),
        beat(5.58, N),
        beat(6.12, E),
        beat(6.36, S),
        beat(7.0, WEST),
        beat(7.52, N, true),
        beat(7.88, E),
        beat(8.4, S),
        beat(8.64, WEST)
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
  const btnClap = document.getElementById("btn-clap");
  const stageLabel = document.getElementById("stage-label");
  const hitLabel = document.getElementById("hit-label");
  const pipsEl = document.getElementById("pips");
  const toastEl = document.getElementById("toast");
  const hintEl = document.getElementById("hint");

  const coarse = window.matchMedia("(pointer: coarse)").matches;

  let W = 1;
  let H = 1;
  let dpr = 1;
  let hidden = false;

  const L = {
    cx: 0,
    cy: 0,
    R: 140,
    Z: 32,
    rad: 18
  };

  const G = {
    mode: "title",
    stage: 0,
    t: 0,
    clock: 0,
    lives: LIVES,
    hits: 0,
    need: 1,
    combo: 0,
    maxCombo: 0,
    perfects: 0,
    total: 0,
    lock: 0,
    hold: 0,
    clap: 0,
    shake: 0,
    flash: 0,
    flashCol: PINK,
    toastT: 0,
    judge: "",
    judgeCol: CYAN,
    judgeT: 0,
    endT: 0,
    taught: false,
    heat: 0,
    pulse: 0,
    crack: 0
  };

  const walls = [
    { pulse: 0, seal: 0, glow: 0 },
    { pulse: 0, seal: 0, glow: 0 },
    { pulse: 0, seal: 0, glow: 0 },
    { pulse: 0, seal: 0, glow: 0 }
  ];

  const waves = [];
  const motes = [];
  const particles = [];
  const sparks = [];
  const ripples = [];
  const floats = [];

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function ease(t) {
    t = clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
  }
  function hexRgb(h) {
    return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  }
  function rgba(h, a) {
    const c = hexRgb(h);
    return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")";
  }

  const audio = {
    ctx: null,
    master: null,
    drone: null,
    droneGain: null,
    muted: false,
    lastNear: -9,
    ensure() {
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
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.28;
      btnMute.textContent = m ? "静" : "声";
      btnMute.classList.toggle("muted", m);
      btnMute.setAttribute("aria-label", m ? "取消静音" : "静音");
      try {
        localStorage.setItem(MUTE_KEY, m ? "1" : "0");
      } catch (e) { /* ignore */ }
    },
    beep(freq, dur, type, vol, slide, when) {
      if (!this.ctx || this.muted) return;
      const t = when != null ? when : this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || "sine";
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
      g.gain.setValueAtTime(Math.max(0.0001, vol), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + dur + 0.04);
    },
    noise(dur, vol, freq, when) {
      if (!this.ctx || this.muted) return;
      const t = when != null ? when : this.ctx.currentTime;
      const n = Math.max(1, (this.ctx.sampleRate * dur) | 0);
      const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = freq || 1800;
      f.Q.value = 0.85;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(Math.max(0.0001, vol), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
      src.stop(t + dur + 0.03);
    },
    emit() {
      this.ensure();
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      this.beep(196, 0.22, "sine", 0.05, 110, t);
      this.noise(0.16, 0.045, 900, t);
      this.beep(330, 0.28, "triangle", 0.03, 180, t + 0.05);
    },
    clap(perfect) {
      this.ensure();
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      this.noise(0.05, perfect ? 0.11 : 0.08, perfect ? 2400 : 1700, t);
      this.beep(90, 0.1, "sine", 0.09, 50, t);
      this.beep(perfect ? 880 : 620, 0.12, "triangle", perfect ? 0.07 : 0.05, perfect ? 1480 : 980, t);
      this.noise(0.09, 0.035, 700, t + 0.07);
      this.beep(220, 0.18, "sine", 0.03, 90, t + 0.09);
      if (perfect) this.beep(1320, 0.16, "sine", 0.045, 1760, t);
    },
    empty() {
      this.ensure();
      this.noise(0.04, 0.03, 1400);
      this.beep(240, 0.07, "square", 0.025, 90);
    },
    miss() {
      this.ensure();
      this.beep(180, 0.32, "sawtooth", 0.08, 55);
      this.noise(0.16, 0.07, 520);
    },
    haze() {
      this.ensure();
      this.beep(510, 0.18, "sine", 0.028, 180);
      this.noise(0.1, 0.022, 2400);
    },
    near() {
      this.ensure();
      const now = this.ctx ? this.ctx.currentTime : 0;
      if (now - this.lastNear < 0.18) return;
      this.lastNear = now;
      this.beep(1240, 0.045, "sine", 0.028, 1680);
    },
    clear() {
      this.ensure();
      this.beep(392, 0.12, "triangle", 0.07, 784);
      this.beep(784, 0.22, "sine", 0.05, 1176);
    },
    win() {
      this.ensure();
      this.beep(440, 0.16, "triangle", 0.09, 880);
      this.beep(660, 0.26, "sine", 0.07, 1320);
      this.beep(880, 0.4, "sine", 0.05, 1760);
    },
    lose() {
      this.ensure();
      this.beep(196, 0.5, "sawtooth", 0.09, 48);
      this.beep(82, 0.7, "square", 0.05, 36);
    },
    start() {
      this.ensure();
      this.beep(220, 0.16, "sine", 0.07, 523);
    },
    tickDrone(heat) {
      if (!this.ctx || this.muted) return;
      if (!this.drone) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = "sine";
        o.frequency.value = 52;
        g.gain.value = 0.0001;
        o.connect(g);
        g.connect(this.master);
        o.start();
        this.drone = o;
        this.droneGain = g;
      }
      const t = this.ctx.currentTime;
      const playing = G.mode === "play" || G.mode === "clear";
      this.drone.frequency.setTargetAtTime(52 + heat * 28, t, 0.14);
      this.droneGain.gain.setTargetAtTime(
        playing ? 0.014 + heat * 0.03 : 0.0001,
        t,
        0.16
      );
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === "1") audio.setMuted(true);
  } catch (e) { /* ignore */ }

  function stageNeed(st) {
    let n = 0;
    for (let i = 0; i < st.hits.length; i++) if (!st.hits[i].ghost) n++;
    return n;
  }

  function makeMotes() {
    motes.length = 0;
    for (let i = 0; i < 64; i++) {
      motes.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.3 + 0.2,
        a: Math.random() * 0.3 + 0.04,
        p: Math.random() * TAU,
        s: Math.random() * 0.01 + 0.002
      });
    }
  }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 140) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life,
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        col: spec.col || CYAN
      });
    }
  }

  function spark(x, y, n, col) {
    for (let i = 0; i < n; i++) {
      if (sparks.length > 90) sparks.shift();
      const a = rand(0, TAU);
      const sp = rand(50, 240);
      sparks.push({
        x: x,
        y: y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: rand(0.16, 0.48),
        col: col
      });
    }
  }

  function ripple(x, y, col, max) {
    if (ripples.length > 12) ripples.shift();
    ripples.push({ x: x, y: y, t: 1, col: col, max: max || L.Z * 2.2 });
  }

  function floatAt(x, y, text, col) {
    if (floats.length > 10) floats.shift();
    floats.push({ x: x, y: y, text: text, col: col, t: 1 });
  }

  function toast(msg, kind) {
    toastEl.textContent = msg;
    toastEl.classList.toggle("warn", kind === "warn");
    toastEl.classList.toggle("gold", kind === "gold");
    toastEl.classList.remove("hidden");
    G.toastT = 2.2;
  }

  function judge(text, col) {
    G.judge = text;
    G.judgeCol = col;
    G.judgeT = 0.62;
  }

  function wavePos(wall, p) {
    const dist = p * (L.R - L.Z);
    if (wall === N) return { x: L.cx, y: L.cy - L.R + dist, horz: true };
    if (wall === S) return { x: L.cx, y: L.cy + L.R - dist, horz: true };
    if (wall === E) return { x: L.cx + L.R - dist, y: L.cy, horz: false };
    return { x: L.cx - L.R + dist, y: L.cy, horz: false };
  }

  function wallMid(wall) {
    if (wall === N) return { x: L.cx, y: L.cy - L.R };
    if (wall === S) return { x: L.cx, y: L.cy + L.R };
    if (wall === E) return { x: L.cx + L.R, y: L.cy };
    return { x: L.cx - L.R, y: L.cy };
  }

  function spawnWave(spec, travel, dark) {
    const w = {
      wall: spec.wall,
      ghost: !!spec.ghost,
      dark: !!dark,
      hitAt: spec.at,
      travel: travel,
      judged: false,
      state: "wait",
      p: 0,
      back: 0,
      emitted: false,
      near: false
    };
    waves.push(w);
    return w;
  }

  function loadStage(i) {
    const st = STAGES[i];
    waves.length = 0;
    G.stage = i;
    G.t = 0;
    G.hits = 0;
    G.need = stageNeed(st);
    G.hold = 0.42;
    G.lock = 0.12;
    G.judgeT = 0;
    G.crack = 0;
    for (let k = 0; k < 4; k++) {
      walls[k].pulse = 0;
      walls[k].seal = 0;
      walls[k].glow = 0;
    }
    for (let j = 0; j < st.hits.length; j++) {
      spawnWave(st.hits[j], st.travel, !!st.dark);
    }
    toast(st.toast, i === STAGES.length - 1 ? "gold" : i >= 5 ? "warn" : null);
    syncHud();
  }

  function burstCenter(col, n) {
    emit(n, {
      x: L.cx,
      y: L.cy,
      j: 8,
      vx0: -180,
      vx1: 180,
      vy0: -180,
      vy1: 180,
      life: 0.5,
      r0: 1.1,
      r1: 3.2,
      col: col
    });
    spark(L.cx, L.cy, n * 0.6, col);
    ripple(L.cx, L.cy, col, L.Z * 2.6);
  }

  function resolveHit(wave, perfect) {
    wave.judged = true;
    wave.state = "back";
    wave.back = 0;
    G.hits += 1;
    G.total += 1;
    G.combo += 1;
    if (G.combo > G.maxCombo) G.maxCombo = G.combo;
    if (perfect) G.perfects += 1;
    walls[wave.wall].seal += 1;
    walls[wave.wall].glow = 1;
    G.flash = perfect ? 0.34 : 0.2;
    G.flashCol = perfect ? GOLD : CYAN;
    G.clap = 1;
    audio.clap(perfect);
    burstCenter(perfect ? GOLD : CYAN, perfect ? 18 : 12);
    const label = perfect ? "正拍" : G.combo >= 3 ? G.combo + " 连" : "拍回";
    floatAt(L.cx, L.cy - L.Z - 10, label, perfect ? GOLD : CYAN);
    judge(label, perfect ? GOLD : CYAN);
    if (!G.taught) {
      G.taught = true;
      toast("拍回去了 · 等下一浪", null);
    }
    syncHud();
    maybeFinish();
  }

  function realsJudged() {
    let any = false;
    for (let i = 0; i < waves.length; i++) {
      const w = waves[i];
      if (w.ghost) continue;
      any = true;
      if (!w.judged) return false;
    }
    return any;
  }

  function maybeFinish() {
    if (G.mode !== "play" || G.lives <= 0) return;
    if (realsJudged()) startClear();
  }

  function miss(kind, wave) {
    G.combo = 0;
    G.lives -= 1;
    G.flash = 0.44;
    G.flashCol = PINK;
    G.shake = 9;
    G.crack = 1;
    G.clap = 0.55;
    if (wave) {
      wave.judged = true;
      if (wave.state !== "back") wave.state = "dead";
    }
    audio.miss();
    burstCenter(PINK, 14);
    const text =
      kind === "early" ? "早了" :
      kind === "late" ? "迟了" :
      kind === "ghost" ? "虚响" :
      kind === "leak" ? "漏拍" : "失拍";
    floatAt(L.cx, L.cy - L.Z - 8, text, PINK);
    judge(text, PINK);
    toast(
      kind === "early" ? "太早了" :
      kind === "late" ? "浪已经过了" :
      kind === "ghost" ? "虚响不拍" :
      kind === "leak" ? (wave ? WALL_NAME[wave.wall] + "墙漏拍" : "漏过一浪") : "失拍",
      "warn"
    );
    syncHud();
    if (G.lives <= 0) startLose();
    else maybeFinish();
  }

  function clap() {
    if (G.mode === "title" || G.mode === "win" || G.mode === "lose") {
      startPlay();
      return;
    }
    if (G.mode !== "play") return;
    if (G.hold > 0 || G.lock > 0) return;
    G.lock = 0.09;
    G.clap = 1;
    btnClap.classList.add("held");

    const st = STAGES[G.stage];
    let best = null;
    let bestAbs = 99;
    const catchW = st.window * 1.55 + 0.04;
    for (let i = 0; i < waves.length; i++) {
      const w = waves[i];
      if (w.judged || w.state === "wait") continue;
      const dt = G.t - w.hitAt;
      const abs = dt < 0 ? -dt : dt;
      if (abs > catchW) continue;
      if (!best || w.hitAt < best.hitAt - 1e-6) {
        best = w;
        bestAbs = abs;
      }
    }

    if (best) {
      if (best.ghost) {
        miss("ghost", best);
        return;
      }
      if (bestAbs <= st.window) {
        resolveHit(best, bestAbs <= st.perfect);
        return;
      }
      miss(G.t < best.hitAt ? "early" : "late", best);
      return;
    }

    G.combo = 0;
    audio.empty();
    ripple(L.cx, L.cy, "rgba(255,255,255,0.7)", L.Z * 1.6);
    floatAt(L.cx, L.cy - L.Z - 6, "空拍", "#9aa0c8");
    syncHud();
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.parentElement.getBoundingClientRect();
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    canvas.width = Math.max(1, (W * dpr) | 0);
    canvas.height = Math.max(1, (H * dpr) | 0);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const pad = coarse ? 74 : 28;
    const side = Math.min(W * 0.86, (H - pad) * 0.82);
    L.R = clamp(side * 0.5, 92, 228);
    L.Z = clamp(L.R * 0.22, 26, 48);
    L.rad = clamp(L.R * 0.08, 10, 22);
    L.cx = W * 0.5;
    L.cy = H * (coarse ? 0.45 : 0.5);
  }

  function syncHud() {
    if (G.mode === "title") {
      stageLabel.textContent = "十室回声";
      stageLabel.classList.remove("hot");
      hitLabel.textContent = "拍回 —";
      hitLabel.classList.remove("warn");
      hintEl.textContent = coarse
        ? "青浪贴掌心再拍 · 品红虚响放过"
        : "青浪贴掌心再拍 · 空格 / 点击";
      hintEl.classList.remove("hot", "warn");
    } else {
      const st = STAGES[G.stage];
      stageLabel.textContent = st.name + " · " + st.sub;
      stageLabel.classList.toggle("hot", G.stage >= STAGES.length - 1);
      const combo = G.combo >= 2 ? "  · " + G.combo + "连" : "";
      hitLabel.textContent = "拍 " + G.hits + "/" + G.need + combo;
      hitLabel.classList.toggle("warn", G.lives <= 1 && G.mode === "play");
      hintEl.textContent = st.hint;
      hintEl.classList.toggle("warn", !!st.hits.some(function (h) { return h.ghost; }));
      hintEl.classList.toggle("hot", G.stage >= STAGES.length - 1);
    }
    pipsEl.innerHTML = "";
    const show = G.mode === "title" ? 0 : LIVES;
    for (let i = 0; i < show; i++) {
      const pip = document.createElement("span");
      pip.className = "pip";
      if (i < G.lives) {
        pip.classList.add("on");
        if (G.lives <= 1 && G.mode === "play") pip.classList.add("warn");
      }
      pipsEl.appendChild(pip);
    }
  }

  function showPanel(kind) {
    overlay.classList.remove("hidden");
    panel.classList.remove("win", "lose");
    if (kind === "title") {
      ovKicker.textContent = "CLAP";
      ovTitle.textContent = "拍回";
      ovLead.innerHTML = "四面墙把回声浪推到掌心。<br />浪贴上内环的瞬间，拍手把它拍回去。";
      ovOps.textContent = coarse
        ? "点「拍」或点画布 · M 静音"
        : "空格 / J 拍手 · 点按画布 · M 静音";
      ovBtn.textContent = "入室";
    } else if (kind === "win") {
      panel.classList.add("win");
      ovKicker.textContent = "CLEAR";
      ovTitle.textContent = "满堂";
      ovLead.textContent = "十室回声全部拍回。房间安静下来。";
      ovOps.textContent =
        "拍回 " + G.total + " · 正拍 " + G.perfects + " · 最高连击 " + G.maxCombo;
      ovBtn.textContent = "再入一室";
    } else {
      panel.classList.add("lose");
      ovKicker.textContent = "LOST";
      ovTitle.textContent = "哑室";
      ovLead.textContent = "三记失拍。回声散尽，房间哑了。";
      ovOps.textContent = "已拍 " + G.total + " · 第 " + (G.stage + 1) + " 室";
      ovBtn.textContent = "再入一室";
    }
  }

  function hidePanel() {
    overlay.classList.add("hidden");
  }

  function resetRun() {
    G.stage = 0;
    G.t = 0;
    G.lives = LIVES;
    G.hits = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.perfects = 0;
    G.total = 0;
    G.hold = 0;
    G.lock = 0;
    G.clap = 0;
    G.shake = 0;
    G.flash = 0;
    G.judgeT = 0;
    G.endT = 0;
    G.taught = false;
    G.crack = 0;
    particles.length = 0;
    sparks.length = 0;
    ripples.length = 0;
    floats.length = 0;
    makeMotes();
    loadStage(0);
  }

  function startPlay() {
    audio.start();
    resetRun();
    G.mode = "play";
    hidePanel();
    syncHud();
  }

  function startClear() {
    G.mode = "clear";
    G.endT = 0.95;
    audio.clear();
    G.flash = 0.42;
    G.flashCol = CYAN;
    toast(STAGES[G.stage].name + " 拍回", G.stage >= STAGES.length - 1 ? "gold" : null);
    ripple(L.cx, L.cy, CYAN, L.R * 1.05);
    for (let i = 0; i < 4; i++) walls[i].glow = 1;
  }

  function startWin() {
    G.mode = "win";
    audio.win();
    showPanel("win");
    syncHud();
  }

  function startLose() {
    G.mode = "tolose";
    G.endT = 0.7;
    audio.lose();
    G.flash = 0.55;
    G.flashCol = PINK;
    G.shake = 12;
  }

  function updateWaves(dt) {
    const st = STAGES[G.stage];
    for (let i = 0; i < waves.length; i++) {
      const w = waves[i];
      const spawn = w.hitAt - w.travel;
      if (G.t < spawn) continue;
      if (!w.emitted) {
        w.emitted = true;
        w.state = "in";
        walls[w.wall].pulse = 1;
        if (!w.ghost) audio.emit();
        else audio.haze();
      }
      if (w.state === "in") {
        w.p = (G.t - spawn) / w.travel;
        const until = w.hitAt + st.window;
        if (!w.near && !w.ghost && G.t > w.hitAt - 0.32 && G.t < w.hitAt + 0.05) {
          w.near = true;
          audio.near();
        }
        if (!w.judged && G.t > until) {
          if (w.ghost) {
            w.judged = true;
            w.state = "dead";
          } else if (G.mode === "play") {
            miss("leak", w);
          } else {
            w.judged = true;
            w.state = "dead";
          }
        }
        if (w.p > 1.55) w.state = "gone";
      } else if (w.state === "back") {
        w.back += dt / Math.max(0.28, w.travel * 0.42);
        if (w.back >= 1) {
          w.state = "gone";
          const mid = wallMid(w.wall);
          spark(mid.x, mid.y, 8, GOLD);
        }
      } else if (w.state === "dead") {
        w.p += dt / w.travel;
        if (w.p > 1.7) w.state = "gone";
      }
    }
    maybeFinish();
  }

  function updateFx(dt) {
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 22);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.5);
    if (G.lock > 0) G.lock -= dt;
    if (G.hold > 0) G.hold -= dt;
    if (G.clap > 0) G.clap = Math.max(0, G.clap - dt * 3.6);
    if (G.clap < 0.2) btnClap.classList.remove("held");
    if (G.judgeT > 0) G.judgeT -= dt;
    if (G.crack > 0) G.crack = Math.max(0, G.crack - dt * 1.4);
    G.pulse += dt;
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) toastEl.classList.add("hidden");
    }
    for (let i = 0; i < 4; i++) {
      walls[i].pulse = Math.max(0, walls[i].pulse - dt * 1.8);
      walls[i].glow = Math.max(0, walls[i].glow - dt * 0.55);
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.life -= dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vx *= 0.96;
      q.vy *= 0.96;
      if (q.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const q = sparks[i];
      q.life -= dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vx *= 0.9;
      q.vy *= 0.9;
      if (q.life <= 0) sparks.splice(i, 1);
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.t -= dt * 1.35;
      if (r.t <= 0) ripples.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t -= dt * 0.85;
      f.y -= 30 * dt;
      if (f.t <= 0) floats.splice(i, 1);
    }
  }

  function heatNow() {
    let h = 0;
    for (let i = 0; i < waves.length; i++) {
      const w = waves[i];
      if (w.judged || w.state === "wait" || w.ghost) continue;
      const dt = w.hitAt - G.t;
      if (dt < -0.2 || dt > 1.2) continue;
      const near = Math.exp(-Math.abs(dt) * 3.2);
      h = Math.max(h, near);
    }
    return clamp(h, 0, 1);
  }

  function updateDemo(dt) {
    if (waves.length === 0) {
      spawnWave({ at: 2.4, wall: N, ghost: false }, 1.9, false);
    }
    G.t += dt;
    const w = waves[0];
    const spawn = w.hitAt - w.travel;
    if (G.t < spawn) return;
    if (!w.emitted) {
      w.emitted = true;
      w.state = "in";
      walls[N].pulse = 1;
    }
    w.p = (G.t - spawn) / w.travel;
    const close = Math.abs(G.t - w.hitAt);
    if (close < 0.08 && G.clap < 0.4) {
      G.clap = 1;
      ripple(L.cx, L.cy, GOLD, L.Z * 2.2);
      spark(L.cx, L.cy, 6, CYAN);
      w.state = "back";
      w.back = 0;
      w.judged = true;
      walls[N].glow = 1;
    }
    if (w.state === "back") {
      w.back += dt / 0.7;
      if (w.back >= 1 || G.t > w.hitAt + 1.6) {
        waves.length = 0;
        G.t = 0;
        G.clap = 0;
        for (let i = 0; i < 4; i++) {
          walls[i].pulse = 0;
          walls[i].glow = 0;
        }
      }
    } else if (w.p > 1.6) {
      waves.length = 0;
      G.t = 0;
    }
  }

  function updatePlay(dt) {
    G.t += dt;
    if (G.mode === "play" || G.mode === "clear" || G.mode === "tolose") {
      updateWaves(dt);
    }
    if (G.mode === "clear") {
      G.endT -= dt;
      if (G.endT <= 0) {
        if (G.stage + 1 >= STAGES.length) startWin();
        else {
          G.mode = "play";
          loadStage(G.stage + 1);
        }
      }
    }
    if (G.mode === "tolose") {
      G.endT -= dt;
      if (G.endT <= 0) {
        G.mode = "lose";
        showPanel("lose");
      }
    }
  }

  function roundRoom(r) {
    const x = L.cx - r;
    const y = L.cy - r;
    const s = r * 2;
    const rad = L.rad;
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + s, y, x + s, y + s, rad);
    ctx.arcTo(x + s, y + s, x, y + s, rad);
    ctx.arcTo(x, y + s, x, y, rad);
    ctx.arcTo(x, y, x + s, y, rad);
    ctx.closePath();
  }

  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#120818");
    g.addColorStop(0.55, "#090510");
    g.addColorStop(1, "#04020c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, WEST, H);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const pulse = 0.5 + Math.sin(G.clock * 0.7) * 0.5;
    const mag = ctx.createRadialGradient(W * 0.18, H * 0.16, 8, W * 0.18, H * 0.16, H * 0.55);
    mag.addColorStop(0, "rgba(255, 61, 184," + (0.07 + pulse * 0.04) + ")");
    mag.addColorStop(1, "rgba(255, 61, 184, 0)");
    ctx.fillStyle = mag;
    ctx.fillRect(0, 0, WEST, H);
    const cyn = ctx.createRadialGradient(W * 0.82, H * 0.8, 8, W * 0.82, H * 0.8, H * 0.5);
    cyn.addColorStop(0, "rgba(0, 240, 255, 0.07)");
    cyn.addColorStop(1, "rgba(0, 240, 255, 0)");
    ctx.fillStyle = cyn;
    ctx.fillRect(0, 0, WEST, H);
    ctx.restore();

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const x = m.x * W + Math.sin(G.clock * 0.35 + m.p) * m.s * W;
      const y = m.y * H;
      ctx.fillStyle = "rgba(190, 220, 255," + m.a + ")";
      ctx.beginPath();
      ctx.arc(x, y, m.r, 0, TAU);
      ctx.fill();
    }
  }

  function drawRoom() {
    ctx.save();
    roundRoom(L.R + 10);
    ctx.fillStyle = "#07040f";
    ctx.fill();
    ctx.restore();

    ctx.save();
    roundRoom(L.R);
    ctx.clip();

    const floor = ctx.createRadialGradient(L.cx, L.cy, L.Z, L.cx, L.cy, L.R);
    floor.addColorStop(0, "rgba(18, 12, 36, 0.9)");
    floor.addColorStop(0.55, "rgba(8, 6, 18, 0.95)");
    floor.addColorStop(1, "rgba(4, 2, 10, 1)");
    ctx.fillStyle = floor;
    ctx.fillRect(L.cx - L.R, L.cy - L.R, L.R * 2, L.R * 2);

    ctx.strokeStyle = "rgba(0, 240, 255, 0.05)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
      const r = L.Z + (L.R - L.Z) * (i / 5);
      ctx.beginPath();
      ctx.arc(L.cx, L.cy, r, 0, TAU);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(L.cx - L.R, L.cy);
    ctx.lineTo(L.cx + L.R, L.cy);
    ctx.moveTo(L.cx, L.cy - L.R);
    ctx.lineTo(L.cx, L.cy + L.R);
    ctx.strokeStyle = "rgba(255, 61, 184, 0.05)";
    ctx.stroke();

    if (G.crack > 0) {
      ctx.save();
      ctx.globalAlpha = G.crack * 0.7;
      ctx.strokeStyle = PINK;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(L.cx - L.R * 0.2, L.cy - L.R * 0.55);
      ctx.lineTo(L.cx - L.R * 0.05, L.cy - L.R * 0.1);
      ctx.lineTo(L.cx - L.R * 0.22, L.cy + L.R * 0.35);
      ctx.moveTo(L.cx + L.R * 0.28, L.cy - L.R * 0.4);
      ctx.lineTo(L.cx + L.R * 0.08, L.cy);
      ctx.lineTo(L.cx + L.R * 0.32, L.cy + L.R * 0.45);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    ctx.save();
    roundRoom(L.R);
    ctx.strokeStyle = rgba(CYAN, 0.28 + G.heat * 0.25);
    ctx.lineWidth = 2.2;
    ctx.shadowBlur = 16;
    ctx.shadowColor = CYAN;
    ctx.stroke();
    ctx.restore();
  }

  function drawEmitter(wall) {
    const pulse = walls[wall].pulse;
    const glow = walls[wall].glow;
    const seal = walls[wall].seal;
    const thick = 7 + pulse * 5 + glow * 3;
    const col = glow > 0.15 ? GOLD : pulse > 0.2 ? CYAN : "#6a70a0";
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = rgba(col, 0.35 + pulse * 0.55 + glow * 0.4);
    ctx.lineWidth = thick;
    ctx.lineCap = "round";
    ctx.shadowBlur = 18;
    ctx.shadowColor = col;
    const inset = 16;
    ctx.beginPath();
    if (wall === N) {
      ctx.moveTo(L.cx - L.R + inset, L.cy - L.R + 4);
      ctx.lineTo(L.cx + L.R - inset, L.cy - L.R + 4);
    } else if (wall === S) {
      ctx.moveTo(L.cx - L.R + inset, L.cy + L.R - 4);
      ctx.lineTo(L.cx + L.R - inset, L.cy + L.R - 4);
    } else if (wall === E) {
      ctx.moveTo(L.cx + L.R - 4, L.cy - L.R + inset);
      ctx.lineTo(L.cx + L.R - 4, L.cy + L.R - inset);
    } else {
      ctx.moveTo(L.cx - L.R + 4, L.cy - L.R + inset);
      ctx.lineTo(L.cx - L.R + 4, L.cy + L.R - inset);
    }
    ctx.stroke();
    ctx.restore();

    if (seal > 0) {
      const mid = wallMid(wall);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = rgba(GOLD, 0.18 + glow * 0.25);
      ctx.beginPath();
      ctx.arc(mid.x, mid.y, 5 + seal * 1.4, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawWaveLine(wall, p, col, alpha, dashed, width) {
    const pos = wavePos(wall, clamp(p, 0, 1.45));
    const span = L.R - 14;
    const bow = (1 - Math.abs(p - 0.7)) * L.R * 0.08;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = clamp(alpha, 0, 1);
    ctx.strokeStyle = col;
    ctx.lineWidth = width || 3.2;
    ctx.shadowBlur = 16;
    ctx.shadowColor = col;
    ctx.lineCap = "round";
    if (dashed) ctx.setLineDash([7, 8]);
    ctx.beginPath();
    if (pos.horz) {
      const y = pos.y;
      const toward = wall === N ? 1 : -1;
      ctx.moveTo(L.cx - span, y);
      ctx.quadraticCurveTo(L.cx, y + toward * bow, L.cx + span, y);
    } else {
      const x = pos.x;
      const toward = wall === WEST ? 1 : -1;
      ctx.moveTo(x, L.cy - span);
      ctx.quadraticCurveTo(x + toward * bow, L.cy, x, L.cy + span);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawWaves() {
    ctx.save();
    roundRoom(L.R - 2);
    ctx.clip();
    for (let i = 0; i < waves.length; i++) {
      const w = waves[i];
      if (w.state === "wait" || w.state === "gone") continue;
      if (w.state === "back") {
        const p = 1 - ease(clamp(w.back, 0, 1));
        drawWaveLine(w.wall, p, GOLD, 0.85 * (1 - w.back * 0.3), false, 3.6);
        continue;
      }
      const p = w.p;
      let vis = 1;
      if (w.dark) vis = ease(clamp((p - 0.42) / 0.45, 0, 1));
      if (w.state === "dead") vis *= clamp(1.4 - p, 0, 1);
      if (p > 1) vis *= clamp(1.5 - p, 0, 1);
      if (vis < 0.02) continue;
      const approaching = clamp(1 - Math.abs(p - 1) * 2.4, 0, 1);
      if (w.ghost) {
        drawWaveLine(w.wall, p, PINK, (0.35 + approaching * 0.45) * vis, true, 2.6);
      } else {
        const col = approaching > 0.55 ? "#e8ffff" : CYAN;
        drawWaveLine(w.wall, p, col, (0.42 + approaching * 0.5) * vis, false, 3.1 + approaching * 1.4);
        if (approaching > 0.3) {
          drawWaveLine(w.wall, p, GOLD, approaching * 0.25 * vis, false, 1.4);
        }
      }
    }
    ctx.restore();
  }

  function drawClapRing() {
    const hot = G.heat;
    const clap = ease(G.clap);
    const r = L.Z * (1 - clap * 0.08);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = rgba(GOLD, 0.22 + hot * 0.55 + clap * 0.4);
    ctx.lineWidth = 2.2 + hot * 2.2;
    ctx.shadowBlur = 14;
    ctx.shadowColor = GOLD;
    ctx.setLineDash([5, 7]);
    ctx.lineDashOffset = -G.clock * 22;
    ctx.beginPath();
    ctx.arc(L.cx, L.cy, r, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = rgba(CYAN, 0.12 + hot * 0.25);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(L.cx, L.cy, r * 1.18, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  function drawHands() {
    const clap = ease(G.clap);
    const spread = lerp(L.Z * 0.62, L.Z * 0.08, clap);
    const scale = L.Z / 34;
    const leftCol = clap > 0.4 ? "#fff6d8" : PINK;
    const rightCol = clap > 0.4 ? "#fff6d8" : CYAN;

    function palm(x, side, col) {
      ctx.save();
      ctx.translate(x, L.cy);
      ctx.rotate(side * lerp(0.22, 0.02, clap));
      ctx.scale(scale, scale);
      ctx.globalCompositeOperation = "lighter";
      const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 22);
      glow.addColorStop(0, rgba(col, 0.85));
      glow.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, TAU);
      ctx.fill();
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(0, 2, 9.2, 12.2, 0, 0, TAU);
      ctx.fill();
      for (let i = 0; i < 4; i++) {
        const fx = (i - 1.5) * 4.4;
        ctx.beginPath();
        ctx.ellipse(fx, -11, 2.15, 5.6, side * 0.08, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.beginPath();
      ctx.ellipse(-2.2, 0, 2.4, 3.2, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    palm(L.cx - spread, -1, leftCol);
    palm(L.cx + spread, 1, rightCol);

    if (clap > 0.35) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = rgba(GOLD, (clap - 0.35) * 0.7);
      ctx.beginPath();
      ctx.arc(L.cx, L.cy, 8 + clap * 10, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawFx() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < ripples.length; i++) {
      const r = ripples[i];
      const k = 1 - r.t;
      ctx.strokeStyle = typeof r.col === "string" && r.col.charAt(0) === "#"
        ? rgba(r.col, r.t * 0.7)
        : r.col;
      ctx.globalAlpha = r.t;
      ctx.lineWidth = 2.4 * r.t;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.max * k, 0, TAU);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < particles.length; i++) {
      const q = particles[i];
      ctx.fillStyle = rgba(q.col, q.life / q.max);
      ctx.beginPath();
      ctx.arc(q.x, q.y, q.r, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const q = sparks[i];
      ctx.strokeStyle = rgba(q.col, clamp(q.life * 3, 0, 1));
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(q.x, q.y);
      ctx.lineTo(q.x - q.vx * 0.03, q.y - q.vy * 0.03);
      ctx.stroke();
    }
    ctx.restore();

    ctx.font = "700 13px Segoe UI, PingFang SC, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      ctx.globalAlpha = clamp(f.t * 1.4, 0, 1);
      ctx.fillStyle = f.col;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;

    if (G.judgeT > 0) {
      const a = clamp(G.judgeT / 0.25, 0, 1);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = G.judgeCol;
      ctx.font = "900 " + Math.round(L.Z * 0.55) + "px Segoe UI, PingFang SC, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = G.judgeCol;
      ctx.shadowBlur = 18;
      ctx.fillText(G.judge, L.cx, L.cy + L.Z + 22);
      ctx.restore();
    }
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = rgba(G.flashCol, G.flash * 0.14);
    ctx.fillRect(0, 0, WEST, H);
    ctx.restore();
  }

  function drawTitleHint() {
    if (G.mode !== "title") return;
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = "#c9c6e8";
    ctx.font = "12px Segoe UI, PingFang SC, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("浪到掌心 · 拍回去", L.cx, L.cy + L.R + 22);
    ctx.restore();
  }

  function draw() {
    const sx = G.shake ? rand(-G.shake, G.shake) : 0;
    const sy = G.shake ? rand(-G.shake, G.shake) : 0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.translate(sx, sy);
    drawSky();
    drawRoom();
    for (let i = 0; i < 4; i++) drawEmitter(i);
    drawWaves();
    drawClapRing();
    drawHands();
    drawFx();
    drawFlash();
    drawTitleHint();
  }

  function step(dt) {
    G.heat = heatNow();
    audio.tickDrone(G.heat);
    if (G.mode === "title") updateDemo(dt);
    else updatePlay(dt);
    updateFx(dt);
  }

  let acc = 0;
  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    if (hidden) {
      last = now;
      return;
    }
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.08) dt = 0.08;
    acc += dt;
    G.clock += dt;
    let steps = 0;
    while (acc >= STEP && steps < 5) {
      acc -= STEP;
      step(STEP);
      steps++;
    }
    if (acc >= STEP) acc = 0;
    draw();
  }

  function onConfirm() {
    if (G.mode === "title" || G.mode === "win" || G.mode === "lose") startPlay();
  }

  ovBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    audio.ensure();
    onConfirm();
  });
  btnRetry.addEventListener("click", function (e) {
    e.stopPropagation();
    audio.ensure();
    startPlay();
  });
  btnMute.addEventListener("click", function (e) {
    e.stopPropagation();
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  btnClap.addEventListener("pointerdown", function (e) {
    e.preventDefault();
    e.stopPropagation();
    audio.ensure();
    clap();
  });
  canvas.addEventListener("pointerdown", function (e) {
    if (e.button != null && e.button !== 0) return;
    audio.ensure();
    clap();
  });

  window.addEventListener("keydown", function (e) {
    if (e.repeat) return;
    const k = e.code;
    if (k === "KeyM") {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === "KeyR") {
      e.preventDefault();
      audio.ensure();
      startPlay();
      return;
    }
    if (k === "Space" || k === "KeyJ" || k === "KeyK") {
      e.preventDefault();
      audio.ensure();
      clap();
      return;
    }
    if (k === "Enter") {
      e.preventDefault();
      audio.ensure();
      onConfirm();
    }
  });
  window.addEventListener("keyup", function (e) {
    if (e.code === "Space" || e.code === "KeyJ" || e.code === "KeyK") {
      btnClap.classList.remove("held");
    }
  });

  document.addEventListener("visibilitychange", function () {
    hidden = document.hidden;
    if (!hidden) last = performance.now();
  });
  window.addEventListener("resize", resize);
  canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });

  makeMotes();
  resize();
  showPanel("title");
  syncHud();
  requestAnimationFrame(frame);
})();
