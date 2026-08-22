(() => {
  "use strict";

  const TAU = Math.PI * 2;
  const STEP = 1 / 60;
  const LIVES = 3;
  const MUTE_KEY = "pulse-gate-mute";
  const PINK = "#ff3db8";
  const CYAN = "#00f0ff";
  const GOLD = "#ffe36b";
  const TOP = 0;
  const BOT = 1;
  const VEIN_SAMPLES = 160;

  function beat(at, ghost, slit) {
    return { at: at, ghost: !!ghost, slit: slit || TOP };
  }

  const STAGES = [
    {
      name: "初脉",
      sub: "FIRST",
      hint: "峰顶贴上门缝再敲",
      toast: "等粉峰走到顶缝",
      travel: 2.55,
      window: 0.34,
      perfect: 0.14,
      slits: 1,
      hits: [beat(2.9), beat(5.35), beat(7.8)]
    },
    {
      name: "匀搏",
      sub: "STEADY",
      hint: "五记匀脉，一缝一敲",
      toast: "节奏匀了，跟着走",
      travel: 2.12,
      window: 0.24,
      perfect: 0.1,
      slits: 1,
      hits: [beat(2.45), beat(3.9), beat(5.35), beat(6.8), beat(8.25)]
    },
    {
      name: "窄缝",
      sub: "NARROW",
      hint: "门缝收窄，贴峰心再敲",
      toast: "窗口短了",
      travel: 1.98,
      window: 0.155,
      perfect: 0.068,
      slits: 1,
      hits: [beat(2.25), beat(3.55), beat(4.85), beat(6.15), beat(7.45), beat(8.75)]
    },
    {
      name: "双搏",
      sub: "DUB",
      hint: "一记双峰，连敲两下",
      toast: "Lub-dub · 连敲",
      travel: 1.88,
      window: 0.17,
      perfect: 0.075,
      slits: 1,
      hits: [
        beat(2.35), beat(2.62),
        beat(4.3), beat(4.57),
        beat(6.25), beat(6.52),
        beat(8.2), beat(8.47)
      ]
    },
    {
      name: "虚脉",
      sub: "GHOST",
      hint: "品红是虚脉 · 放过别敲",
      toast: "品红虚脉，别敲门",
      travel: 1.82,
      window: 0.18,
      perfect: 0.08,
      slits: 1,
      hits: [
        beat(2.25),
        beat(3.4, true),
        beat(4.55),
        beat(5.7, true),
        beat(6.85),
        beat(8.0),
        beat(9.15, true)
      ]
    },
    {
      name: "乱律",
      sub: "ARRY",
      hint: "间隔乱了，看峰不靠数",
      toast: "心律不齐",
      travel: 1.76,
      window: 0.155,
      perfect: 0.068,
      slits: 1,
      hits: [beat(2.15), beat(3.02), beat(4.7), beat(5.18), beat(6.85), beat(8.4), beat(8.74)]
    },
    {
      name: "快门",
      sub: "SNAP",
      hint: "更快更紧，贴缝再敲",
      toast: "快脉来了",
      travel: 1.36,
      window: 0.125,
      perfect: 0.054,
      slits: 1,
      hits: [
        beat(1.72), beat(2.34), beat(2.96), beat(3.58),
        beat(4.2), beat(4.82), beat(5.44), beat(6.06)
      ]
    },
    {
      name: "暗脉",
      sub: "DARK",
      hint: "脉很暗，近缝才亮",
      toast: "暗脉近了才看得见",
      travel: 1.7,
      window: 0.145,
      perfect: 0.06,
      slits: 1,
      dark: true,
      hits: [
        beat(2.1),
        beat(3.15, true),
        beat(4.2),
        beat(5.25),
        beat(6.3, true),
        beat(7.35),
        beat(8.4)
      ]
    },
    {
      name: "对缝",
      sub: "TWIN",
      hint: "上下两扇门，绕一圈敲两记",
      toast: "顶缝与底缝",
      travel: 1.58,
      window: 0.14,
      perfect: 0.058,
      slits: 2,
      hits: [
        beat(1.95, false, TOP),
        beat(2.74, false, BOT),
        beat(3.53, false, TOP),
        beat(4.32, false, BOT),
        beat(5.11, false, TOP),
        beat(5.9, false, BOT),
        beat(6.69, false, TOP),
        beat(7.48, false, BOT)
      ]
    },
    {
      name: "通脉",
      sub: "OPEN",
      hint: "虚实交错 · 双缝双搏",
      toast: "最后一扇 · 通脉",
      travel: 1.26,
      window: 0.112,
      perfect: 0.048,
      slits: 2,
      dark: true,
      hits: [
        beat(1.62, false, TOP),
        beat(1.84, false, TOP),
        beat(2.25, true, BOT),
        beat(2.88, false, TOP),
        beat(3.51, false, BOT),
        beat(3.73, false, BOT),
        beat(4.14, true, TOP),
        beat(4.77, false, BOT),
        beat(5.4, false, TOP),
        beat(5.62, false, TOP),
        beat(6.03, false, BOT),
        beat(6.66, false, TOP),
        beat(6.98, true, BOT),
        beat(7.29, false, BOT),
        beat(7.92, false, TOP)
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
  const btnKnock = document.getElementById("btn-knock");
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
    R: 150,
    iris: 58,
    amp: 16
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
    knock: 0,
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
    iris: 0.08,
    irisTarget: 0.08,
    crack: 0,
    spin: 0
  };

  const waves = [];
  const motes = [];
  const particles = [];
  const sparks = [];
  const ripples = [];
  const floats = [];
  const caps = [];

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
  function wrap(a) {
    a = (a + Math.PI) % TAU;
    if (a < 0) a += TAU;
    return a - Math.PI;
  }
  function hexRgb(h) {
    return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  }
  function rgba(h, a) {
    const c = hexRgb(h);
    return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")";
  }
  function slitAngle(slit) {
    return slit === BOT ? Math.PI / 2 : -Math.PI / 2;
  }
  function stageHasGhost(st) {
    for (let i = 0; i < st.hits.length; i++) if (st.hits[i].ghost) return true;
    return false;
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
      this.beep(72, 0.16, "sine", 0.07, 48, t);
      this.beep(110, 0.12, "triangle", 0.03, 70, t + 0.04);
    },
    haze() {
      this.ensure();
      this.beep(420, 0.16, "sine", 0.022, 160);
      this.noise(0.08, 0.018, 2200);
    },
    knock(perfect) {
      this.ensure();
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      this.beep(78, 0.12, "sine", 0.1, 42, t);
      this.noise(0.05, perfect ? 0.09 : 0.06, perfect ? 2100 : 1400, t);
      this.beep(perfect ? 740 : 520, 0.13, "triangle", perfect ? 0.07 : 0.05, perfect ? 1480 : 880, t);
      this.beep(196, 0.2, "sine", 0.035, 90, t + 0.06);
      if (perfect) this.beep(1320, 0.16, "sine", 0.04, 1760, t);
    },
    empty() {
      this.ensure();
      this.noise(0.04, 0.028, 1300);
      this.beep(250, 0.07, "square", 0.022, 90);
    },
    miss() {
      this.ensure();
      this.beep(170, 0.32, "sawtooth", 0.08, 52);
      this.noise(0.16, 0.065, 480);
    },
    near() {
      this.ensure();
      const now = this.ctx ? this.ctx.currentTime : 0;
      if (now - this.lastNear < 0.16) return;
      this.lastNear = now;
      this.beep(1180, 0.04, "sine", 0.026, 1640);
    },
    clear() {
      this.ensure();
      this.beep(392, 0.12, "triangle", 0.07, 784);
      this.beep(784, 0.22, "sine", 0.05, 1176);
      this.beep(220, 0.28, "sine", 0.04, 440);
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
      this.beep(110, 0.14, "sine", 0.07, 220);
      this.beep(330, 0.2, "triangle", 0.045, 660);
    },
    tickDrone(heat) {
      if (!this.ctx || this.muted) return;
      if (!this.drone) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = "sine";
        o.frequency.value = 48;
        g.gain.value = 0.0001;
        o.connect(g);
        g.connect(this.master);
        o.start();
        this.drone = o;
        this.droneGain = g;
      }
      const t = this.ctx.currentTime;
      const playing = G.mode === "play" || G.mode === "clear";
      this.drone.frequency.setTargetAtTime(48 + heat * 32, t, 0.14);
      this.droneGain.gain.setTargetAtTime(
        playing ? 0.014 + heat * 0.032 : 0.0001,
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
    for (let i = 0; i < 70; i++) {
      motes.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.35 + 0.22,
        a: Math.random() * 0.32 + 0.04,
        p: Math.random() * TAU,
        s: Math.random() * 0.012 + 0.002
      });
    }
  }

  function makeCaps() {
    caps.length = 0;
    for (let i = 0; i < 14; i++) {
      caps.push({
        a: (i / 14) * TAU + rand(-0.08, 0.08),
        wob: rand(0.4, 1.2),
        ph: rand(0, TAU),
        mag: i % 2 === 0
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
    ripples.push({ x: x, y: y, t: 1, col: col, max: max || L.iris * 1.8 });
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

  function qrs(d) {
    const x = d / 0.26;
    let y = Math.exp(-((x + 4.15) * (x + 4.15)) / 1.7) * 0.22;
    y -= Math.exp(-((x + 0.52) * (x + 0.52)) / 0.075) * 0.38;
    y += Math.exp(-(x * x) / 0.036) * 1.18;
    y -= Math.exp(-((x - 0.52) * (x - 0.52)) / 0.078) * 0.48;
    y += Math.exp(-((x - 2.35) * (x - 2.35)) / 1.35) * 0.34;
    return y;
  }

  function pulseAngle(w) {
    const omega = TAU / w.travel;
    return slitAngle(w.slit) + omega * (G.t - w.hitAt);
  }

  function spawnTime(w) {
    return w.hitAt - w.travel * 0.78;
  }

  function pulseVis(w) {
    if (w.state === "wait" || w.state === "gone") return 0;
    const spawn = spawnTime(w);
    if (G.t < spawn) return 0;
    let vis = 1;
    if (w.dark) {
      const until = Math.abs(G.t - w.hitAt);
      vis = ease(clamp(1 - until / (w.travel * 0.34), 0, 1));
    }
    if (w.state === "dead") vis *= clamp(1.35 - w.p, 0, 1);
    if (w.state === "back") vis *= clamp(1 - w.back * 0.15, 0, 1);
    const age = G.t - spawn;
    if (age < 0.18) vis *= age / 0.18;
    if (w.p > 1.15 && w.state === "in") vis *= clamp(1.55 - w.p, 0, 1);
    return clamp(vis, 0, 1);
  }

  function slitPos(slit, r) {
    const a = slitAngle(slit);
    const rad = r == null ? L.R : r;
    return { x: L.cx + Math.cos(a) * rad, y: L.cy + Math.sin(a) * rad, a: a };
  }

  function spawnWave(spec, travel, dark) {
    const w = {
      slit: spec.slit || TOP,
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
    G.iris = 0;
    G.irisTarget = 0;
    for (let j = 0; j < st.hits.length; j++) {
      spawnWave(st.hits[j], st.travel, !!st.dark);
    }
    toast(st.toast, i === STAGES.length - 1 ? "gold" : i >= 4 ? "warn" : null);
    syncHud();
  }

  function burstAt(x, y, col, n) {
    emit(n, {
      x: x,
      y: y,
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
    spark(x, y, n * 0.6, col);
    ripple(x, y, col, L.iris * 2.2);
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
    G.irisTarget = G.hits / G.need;
    G.flash = perfect ? 0.34 : 0.2;
    G.flashCol = perfect ? GOLD : CYAN;
    G.knock = 1;
    audio.knock(perfect);
    const pos = slitPos(wave.slit);
    burstAt(pos.x, pos.y, perfect ? GOLD : CYAN, perfect ? 16 : 11);
    ripple(L.cx, L.cy, perfect ? GOLD : CYAN, L.iris * 1.6);
    const label = perfect ? "正中" : G.combo >= 3 ? G.combo + " 连" : "敲开";
    floatAt(pos.x, pos.y - 16, label, perfect ? GOLD : CYAN);
    judge(label, perfect ? GOLD : CYAN);
    if (!G.taught) {
      G.taught = true;
      toast("开了一瓣 · 等下一峰", null);
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
    G.knock = 0.5;
    if (wave) {
      wave.judged = true;
      if (wave.state !== "back") wave.state = "dead";
    }
    audio.miss();
    const pos = wave ? slitPos(wave.slit) : { x: L.cx, y: L.cy - L.R };
    burstAt(pos.x, pos.y, PINK, 14);
    const text =
      kind === "early" ? "早了" :
      kind === "late" ? "迟了" :
      kind === "ghost" ? "虚脉" :
      kind === "leak" ? "漏拍" : "失拍";
    floatAt(pos.x, pos.y - 12, text, PINK);
    judge(text, PINK);
    toast(
      kind === "early" ? "太早了" :
      kind === "late" ? "峰已经过了" :
      kind === "ghost" ? "虚脉不敲" :
      kind === "leak" ? "漏过一峰" : "失拍",
      "warn"
    );
    syncHud();
    if (G.lives <= 0) startLose();
    else maybeFinish();
  }

  function knock() {
    if (G.mode === "title" || G.mode === "win" || G.mode === "lose") {
      startPlay();
      return;
    }
    if (G.mode !== "play") return;
    if (G.hold > 0 || G.lock > 0) return;
    G.lock = 0.09;
    G.knock = 1;
    btnKnock.classList.add("held");

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
    ripple(L.cx, L.cy, "rgba(255,255,255,0.7)", L.iris * 1.4);
    floatAt(L.cx, L.cy - L.iris - 8, "空敲", "#9aa0c8");
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

    const pad = coarse ? 78 : 28;
    const side = Math.min(W * 0.86, (H - pad) * 0.84);
    L.R = clamp(side * 0.42, 96, 232);
    L.iris = clamp(L.R * 0.38, 40, 92);
    L.amp = clamp(L.R * 0.11, 10, 26);
    L.cx = W * 0.5;
    L.cy = H * (coarse ? 0.46 : 0.5);
  }

  function syncHud() {
    if (G.mode === "title") {
      stageLabel.textContent = "十扇脉门";
      stageLabel.classList.remove("hot");
      hitLabel.textContent = "开 —";
      hitLabel.classList.remove("warn");
      hintEl.textContent = coarse
        ? "峰顶贴门缝再敲 · 品红虚脉放过"
        : "峰顶贴门缝再敲 · 空格 / 点击";
      hintEl.classList.remove("hot", "warn");
    } else {
      const st = STAGES[G.stage];
      stageLabel.textContent = st.name + " · " + st.sub;
      stageLabel.classList.toggle("hot", G.stage >= STAGES.length - 1);
      const combo = G.combo >= 2 ? "  · " + G.combo + "连" : "";
      hitLabel.textContent = "开 " + G.hits + "/" + G.need + combo;
      hitLabel.classList.toggle("warn", G.lives <= 1 && G.mode === "play");
      hintEl.textContent = st.hint;
      hintEl.classList.toggle("warn", stageHasGhost(st));
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
      ovKicker.textContent = "PULSE";
      ovTitle.textContent = "脉门";
      ovLead.innerHTML = "脉搏沿着环脉走。<br />峰顶贴上门缝的瞬间，敲一下，虹膜就会开一瓣。";
      ovOps.textContent = coarse
        ? "点「敲」或点画布 · M 静音"
        : "空格 / J 敲门 · 点按画布 · M 静音";
      ovBtn.textContent = "入脉";
    } else if (kind === "win") {
      panel.classList.add("win");
      ovKicker.textContent = "CLEAR";
      ovTitle.textContent = "通脉";
      ovLead.textContent = "十扇脉门全开。血脉通了。";
      ovOps.textContent =
        "敲开 " + G.total + " · 正中 " + G.perfects + " · 最高连击 " + G.maxCombo;
      ovBtn.textContent = "再入一脉";
    } else {
      panel.classList.add("lose");
      ovKicker.textContent = "LOST";
      ovTitle.textContent = "断脉";
      ovLead.textContent = "三记失拍。门缝合上了。";
      ovOps.textContent = "已开 " + G.total + " · 第 " + (G.stage + 1) + " 扇";
      ovBtn.textContent = "再入一脉";
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
    G.knock = 0;
    G.shake = 0;
    G.flash = 0;
    G.judgeT = 0;
    G.endT = 0;
    G.taught = false;
    G.crack = 0;
    G.iris = 0;
    G.irisTarget = 0;
    particles.length = 0;
    sparks.length = 0;
    ripples.length = 0;
    floats.length = 0;
    makeMotes();
    makeCaps();
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
    G.irisTarget = 1;
    audio.clear();
    G.flash = 0.42;
    G.flashCol = CYAN;
    toast(STAGES[G.stage].name + " 开", G.stage >= STAGES.length - 1 ? "gold" : null);
    ripple(L.cx, L.cy, CYAN, L.R * 0.95);
    spark(L.cx, L.cy, 18, GOLD);
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
    G.irisTarget = 0;
  }

  function updateWaves(dt) {
    const st = STAGES[G.stage];
    for (let i = 0; i < waves.length; i++) {
      const w = waves[i];
      const spawn = spawnTime(w);
      if (G.t < spawn) continue;
      if (!w.emitted) {
        w.emitted = true;
        w.state = "in";
        if (!w.ghost) audio.emit();
        else audio.haze();
      }
      if (w.state === "in") {
        w.p = (G.t - spawn) / Math.max(0.001, w.travel * 0.8);
        const until = w.hitAt + st.window;
        if (!w.near && !w.ghost && G.t > w.hitAt - 0.3 && G.t < w.hitAt + 0.05) {
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
        if (G.t > w.hitAt + 0.7) w.state = "gone";
      } else if (w.state === "back") {
        w.back += dt / 0.38;
        if (w.back >= 1) w.state = "gone";
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
    if (G.knock > 0) G.knock = Math.max(0, G.knock - dt * 3.6);
    if (G.knock < 0.2) btnKnock.classList.remove("held");
    if (G.judgeT > 0) G.judgeT -= dt;
    if (G.crack > 0) G.crack = Math.max(0, G.crack - dt * 1.4);
    G.iris += (G.irisTarget - G.iris) * Math.min(1, dt * 5.2);
    G.spin += dt * (0.08 + G.heat * 0.25);
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) toastEl.classList.add("hidden");
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
      spawnWave({ at: 2.5, slit: TOP, ghost: false }, 2.2, false);
    }
    G.t += dt;
    G.irisTarget = 0.1 + Math.sin(G.clock * 0.7) * 0.05;
    const w = waves[0];
    const spawn = spawnTime(w);
    if (G.t < spawn) return;
    if (!w.emitted) {
      w.emitted = true;
      w.state = "in";
    }
    w.p = (G.t - spawn) / w.travel;
    const close = Math.abs(G.t - w.hitAt);
    if (close < 0.08 && G.knock < 0.4) {
      G.knock = 1;
      const pos = slitPos(TOP);
      ripple(pos.x, pos.y, GOLD, L.iris * 1.6);
      spark(pos.x, pos.y, 7, CYAN);
      w.state = "back";
      w.back = 0;
      w.judged = true;
      G.irisTarget = 0.42;
    }
    if (w.state === "back") {
      w.back += dt / 0.7;
      if (w.back >= 1 || G.t > w.hitAt + 1.7) {
        waves.length = 0;
        G.t = 0;
        G.knock = 0;
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

  function veinRadius(ang) {
    let extra = 0;
    for (let i = 0; i < waves.length; i++) {
      const w = waves[i];
      const vis = pulseVis(w);
      if (vis < 0.02) continue;
      let pa = pulseAngle(w);
      let radMul = 1;
      if (w.state === "back") {
        pa = slitAngle(w.slit);
        radMul = lerp(1, 0.18, ease(clamp(w.back, 0, 1)));
      }
      extra += qrs(wrap(ang - pa)) * vis * radMul;
    }
    return extra;
  }

  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#120818");
    g.addColorStop(0.55, "#090510");
    g.addColorStop(1, "#04020c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const pulse = 0.5 + Math.sin(G.clock * 0.7) * 0.5;
    const mag = ctx.createRadialGradient(W * 0.18, H * 0.16, 8, W * 0.18, H * 0.16, H * 0.55);
    mag.addColorStop(0, "rgba(255, 61, 184," + (0.07 + pulse * 0.04) + ")");
    mag.addColorStop(1, "rgba(255, 61, 184, 0)");
    ctx.fillStyle = mag;
    ctx.fillRect(0, 0, W, H);
    const cyn = ctx.createRadialGradient(W * 0.82, H * 0.8, 8, W * 0.82, H * 0.8, H * 0.5);
    cyn.addColorStop(0, "rgba(0, 240, 255, 0.07)");
    cyn.addColorStop(1, "rgba(0, 240, 255, 0)");
    ctx.fillStyle = cyn;
    ctx.fillRect(0, 0, W, H);
    const core = ctx.createRadialGradient(L.cx, L.cy, 4, L.cx, L.cy, L.R * 1.15);
    core.addColorStop(0, "rgba(255, 61, 184," + (0.04 + G.heat * 0.08) + ")");
    core.addColorStop(0.45, "rgba(0, 240, 255, 0.03)");
    core.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = core;
    ctx.fillRect(0, 0, W, H);
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

  function drawCaps() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    for (let i = 0; i < caps.length; i++) {
      const c = caps[i];
      const wob = Math.sin(G.clock * c.wob + c.ph) * 0.07;
      const a = c.a + wob;
      const r0 = L.iris * 1.02;
      const r1 = L.R * 0.82;
      ctx.strokeStyle = rgba(c.mag ? PINK : CYAN, 0.08 + G.heat * 0.1);
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(L.cx + Math.cos(a) * r0, L.cy + Math.sin(a) * r0);
      const mx = L.cx + Math.cos(a + wob * 0.6) * lerp(r0, r1, 0.55);
      const my = L.cy + Math.sin(a + wob * 0.6) * lerp(r0, r1, 0.55);
      ctx.quadraticCurveTo(mx, my, L.cx + Math.cos(a) * r1, L.cy + Math.sin(a) * r1);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawVein() {
    const amp = L.amp;
    const extras = [];
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i <= VEIN_SAMPLES; i++) {
      const ang = (i / VEIN_SAMPLES) * TAU - Math.PI;
      const extra = veinRadius(ang);
      extras.push(extra);
      const r = L.R + extra * amp;
      const x = L.cx + Math.cos(ang) * r;
      const y = L.cy + Math.sin(ang) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    for (let i = VEIN_SAMPLES; i >= 0; i--) {
      const ang = (i / VEIN_SAMPLES) * TAU - Math.PI;
      const r = L.R - amp * 0.38 - extras[i] * amp * 0.12;
      const x = L.cx + Math.cos(ang) * r;
      const y = L.cy + Math.sin(ang) * r;
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = "rgba(18, 8, 28, 0.72)";
    ctx.fill();
    ctx.strokeStyle = rgba(CYAN, 0.16 + G.heat * 0.18);
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    for (let i = 0; i <= VEIN_SAMPLES; i++) {
      const ang = (i / VEIN_SAMPLES) * TAU - Math.PI;
      const r = L.R + extras[i] * amp;
      const x = L.cx + Math.cos(ang) * r;
      const y = L.cy + Math.sin(ang) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = rgba(PINK, 0.38 + G.heat * 0.35);
    ctx.lineWidth = 2.6;
    ctx.shadowBlur = 18;
    ctx.shadowColor = PINK;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = rgba("#e8ffff", 0.22 + G.heat * 0.4);
    ctx.lineWidth = 1.15;
    ctx.stroke();
    ctx.restore();
  }

  function drawSlits() {
    const st = G.mode === "title" ? STAGES[0] : STAGES[G.stage];
    const n = st.slits || 1;
    const winAng = (st.window / st.travel) * TAU;
    for (let s = 0; s < n; s++) {
      const a = slitAngle(s);
      const hot = G.heat;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = rgba(GOLD, 0.22 + hot * 0.55 + G.knock * 0.25);
      ctx.lineWidth = 4.2 + hot * 2.4;
      ctx.shadowBlur = 18;
      ctx.shadowColor = GOLD;
      ctx.beginPath();
      ctx.arc(L.cx, L.cy, L.R, a - winAng, a + winAng);
      ctx.stroke();
      ctx.restore();

      function post(ang, inward) {
        const c = Math.cos(ang);
        const s2 = Math.sin(ang);
        const r0 = L.R - 10;
        const r1 = L.R + 16;
        ctx.save();
        ctx.strokeStyle = rgba(CYAN, 0.55 + hot * 0.4);
        ctx.lineWidth = 3.2;
        ctx.lineCap = "round";
        ctx.shadowBlur = 12;
        ctx.shadowColor = CYAN;
        ctx.beginPath();
        ctx.moveTo(L.cx + c * r0, L.cy + s2 * r0);
        ctx.lineTo(L.cx + c * r1, L.cy + s2 * r1);
        ctx.stroke();
        ctx.restore();
        if (inward) {
          ctx.save();
          ctx.fillStyle = rgba(GOLD, 0.55 + hot * 0.4);
          ctx.beginPath();
          ctx.arc(L.cx + c * (L.R + 16), L.cy + s2 * (L.R + 16), 3.2 + hot * 1.6, 0, TAU);
          ctx.fill();
          ctx.restore();
        }
      }
      post(a - winAng, false);
      post(a + winAng, false);

      const gem = slitPos(s, L.R + 22);
      ctx.save();
      ctx.translate(gem.x, gem.y);
      ctx.rotate(a + Math.PI / 2);
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.shadowBlur = 10;
      ctx.shadowColor = GOLD;
      ctx.beginPath();
      ctx.moveTo(0, -5.5);
      ctx.lineTo(4.2, 0);
      ctx.lineTo(0, 5.5);
      ctx.lineTo(-4.2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  function drawPeaks() {
    const omega = function (w) { return TAU / w.travel; };
    for (let i = 0; i < waves.length; i++) {
      const w = waves[i];
      const vis = pulseVis(w);
      if (vis < 0.03) continue;
      let a = pulseAngle(w);
      let rad = L.R + qrs(0) * L.amp;
      if (w.state === "back") {
        a = slitAngle(w.slit);
        rad = lerp(L.R, L.iris * 0.55, ease(clamp(w.back, 0, 1)));
      }
      const approaching = clamp(1 - Math.abs(G.t - w.hitAt) * 3.4, 0, 1);
      const col = w.ghost ? PINK : approaching > 0.45 ? GOLD : CYAN;
      const r = L.amp * (w.ghost ? 0.42 : 0.7) + approaching * L.amp * 0.38;

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = vis;
      if (w.state !== "back") {
        for (let k = 1; k <= 8; k++) {
          const ta = a - omega(w) * k * 0.028;
          const tr = L.R + qrs(wrap(ta - a)) * L.amp * 0.25;
          const tx = L.cx + Math.cos(ta) * tr;
          const ty = L.cy + Math.sin(ta) * tr;
          ctx.fillStyle = rgba(w.ghost ? PINK : CYAN, 0.16 * (1 - k / 9));
          ctx.beginPath();
          ctx.arc(tx, ty, r * (0.55 - k * 0.04), 0, TAU);
          ctx.fill();
        }
      }
      const x = L.cx + Math.cos(a) * rad;
      const y = L.cy + Math.sin(a) * rad;
      const glow = ctx.createRadialGradient(x, y, 1, x, y, r * 3.4);
      glow.addColorStop(0, rgba(col, 0.95));
      glow.addColorStop(0.35, rgba(col, 0.32));
      glow.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, r * 3.4, 0, TAU);
      ctx.fill();
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(x, y, r * (w.ghost ? 0.5 : 0.72), 0, TAU);
      ctx.fill();
      if (w.ghost) {
        ctx.strokeStyle = rgba(PINK, 0.95);
        ctx.lineWidth = 1.8;
        ctx.setLineDash([4, 5]);
        ctx.beginPath();
        ctx.arc(x, y, r * 1.12, 0, TAU);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.beginPath();
        ctx.arc(x - r * 0.18, y - r * 0.18, r * 0.22, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawIris() {
    const open = clamp(G.iris, 0, 1);
    const n = 8;
    const R = L.iris;
    const hole = lerp(R * 0.1, R * 0.78, ease(open));
    const spin = G.spin + open * 0.28;
    const knock = ease(G.knock);

    ctx.save();
    ctx.beginPath();
    ctx.arc(L.cx, L.cy, R + 4, 0, TAU);
    ctx.fillStyle = "#08040f";
    ctx.fill();
    ctx.restore();

    if (open > 0.02) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const g = ctx.createRadialGradient(L.cx, L.cy, hole * 0.12, L.cx, L.cy, hole);
      g.addColorStop(0, rgba(GOLD, (0.22 + knock * 0.25) * open));
      g.addColorStop(0.45, rgba(CYAN, (0.14 + G.heat * 0.12) * open));
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(L.cx, L.cy, hole, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    for (let i = 0; i < n; i++) {
      const a0 = spin + (i / n) * TAU;
      const a1 = a0 + TAU / n * 1.38;
      const inner0 = a0 + 0.1;
      const inner1 = a1 - 0.06;
      ctx.beginPath();
      ctx.arc(L.cx, L.cy, R, a0, a1, false);
      ctx.lineTo(L.cx + Math.cos(inner1) * hole, L.cy + Math.sin(inner1) * hole);
      ctx.arc(L.cx, L.cy, hole, inner1, inner0, true);
      ctx.closePath();
      const magMix = i % 2 === 0;
      ctx.fillStyle = magMix ? "#14081c" : "#081218";
      ctx.fill();
      ctx.strokeStyle = rgba(magMix ? PINK : CYAN, 0.2 + open * 0.16 + knock * 0.12);
      ctx.lineWidth = 1.15;
      ctx.stroke();
    }

    if (G.crack > 0) {
      ctx.save();
      ctx.globalAlpha = G.crack * 0.75;
      ctx.strokeStyle = PINK;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(L.cx - R * 0.2, L.cy - R * 0.7);
      ctx.lineTo(L.cx - R * 0.04, L.cy - R * 0.1);
      ctx.lineTo(L.cx - R * 0.22, L.cy + R * 0.55);
      ctx.moveTo(L.cx + R * 0.28, L.cy - R * 0.5);
      ctx.lineTo(L.cx + R * 0.08, L.cy);
      ctx.lineTo(L.cx + R * 0.32, L.cy + R * 0.58);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.beginPath();
    ctx.arc(L.cx, L.cy, R, 0, TAU);
    ctx.strokeStyle = rgba(CYAN, 0.4 + G.heat * 0.4 + knock * 0.2);
    ctx.lineWidth = 2.4;
    ctx.shadowBlur = 16;
    ctx.shadowColor = CYAN;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(L.cx, L.cy, hole, 0, TAU);
    ctx.strokeStyle = rgba(GOLD, 0.18 + open * 0.4);
    ctx.lineWidth = 1.6;
    ctx.shadowColor = GOLD;
    ctx.stroke();
    ctx.restore();

    const ticks = G.need;
    if (G.mode !== "title" && ticks > 0) {
      for (let i = 0; i < ticks; i++) {
        const a = -Math.PI / 2 + (i + 0.5) * (TAU / ticks);
        const on = i < G.hits;
        const rr = R + 8;
        ctx.save();
        ctx.fillStyle = on ? rgba(GOLD, 0.9) : "rgba(120, 126, 168, 0.35)";
        ctx.beginPath();
        ctx.arc(L.cx + Math.cos(a) * rr, L.cy + Math.sin(a) * rr, on ? 2.4 : 1.6, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
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
      ctx.font = "900 " + Math.round(L.iris * 0.38) + "px Segoe UI, PingFang SC, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = G.judgeCol;
      ctx.shadowBlur = 18;
      ctx.fillText(G.judge, L.cx, L.cy + L.iris + 28);
      ctx.restore();
    }
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = rgba(G.flashCol, G.flash * 0.14);
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  function drawTitleHint() {
    if (G.mode !== "title") return;
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = "#c9c6e8";
    ctx.font = "12px Segoe UI, PingFang SC, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("峰到门缝 · 敲开一瓣", L.cx, L.cy + L.R + L.amp + 22);
    ctx.restore();
  }

  function draw() {
    const sx = G.shake ? rand(-G.shake, G.shake) : 0;
    const sy = G.shake ? rand(-G.shake, G.shake) : 0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.translate(sx, sy);
    drawSky();
    drawCaps();
    drawVein();
    drawSlits();
    drawPeaks();
    drawIris();
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
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) {
      audio.ensure();
      onConfirm();
    }
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
  btnKnock.addEventListener("pointerdown", function (e) {
    e.preventDefault();
    e.stopPropagation();
    audio.ensure();
    knock();
  });
  canvas.addEventListener("pointerdown", function (e) {
    if (e.button != null && e.button !== 0) return;
    audio.ensure();
    knock();
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
      knock();
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
      btnKnock.classList.remove("held");
    }
  });

  document.addEventListener("visibilitychange", function () {
    hidden = document.hidden;
    if (!hidden) last = performance.now();
  });
  window.addEventListener("resize", resize);
  canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });

  makeMotes();
  makeCaps();
  resize();
  showPanel("title");
  syncHud();
  requestAnimationFrame(frame);
  if (location.search.indexOf("auto=1") !== -1) {
    setTimeout(function () { startPlay(); }, 40);
    setInterval(function () {
      if (G.mode !== "play") return;
      for (let i = 0; i < waves.length; i++) {
        const w = waves[i];
        if (w.judged || w.ghost || w.state === "wait") continue;
        if (Math.abs(G.t - w.hitAt) < 0.04) knock();
      }
    }, 16);
  }
})();
