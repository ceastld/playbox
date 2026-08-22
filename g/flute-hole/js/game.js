(() => {
  "use strict";

  const TAU = Math.PI * 2;
  const STEP = 1 / 60;
  const LIVES = 3;
  const HOLES = 6;
  const FAULTS = 2;
  const MUTE_KEY = "playbox-flute-hole-mute";
  const PINK = "#ff3db8";
  const CYAN = "#00f0ff";
  const GOLD = "#ffe36b";

  const KEY_HOLE = {
    Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Digit5: 4, Digit6: 5,
    Numpad1: 0, Numpad2: 1, Numpad3: 2, Numpad4: 3, Numpad5: 4, Numpad6: 5,
    KeyA: 0, KeyS: 1, KeyD: 2, KeyF: 3, KeyJ: 4, KeyK: 5
  };
  const KEY_LABEL = ["1", "2", "3", "4", "5", "6"];
  const KEY_ALT = ["A", "S", "D", "F", "J", "K"];

  const SCALE = [
    { name: "清羽", short: "开", hz: 987.77 },
    { name: "清徵", short: "一", hz: 880.0 },
    { name: "清宫", short: "二", hz: 783.99 },
    { name: "羽", short: "三", hz: 659.25 },
    { name: "徵", short: "四", hz: 587.33 },
    { name: "角", short: "五", hz: 493.88 },
    { name: "宫", short: "满", hz: 392.0 }
  ];

  const STAGES = [
    {
      name: "启唇", sub: "FIRST", phrase: "月", notes: [3],
      time: 32, listens: 3, hintHoles: 1, hintDots: 1, preview: 1, leakMark: 1, demo: 1,
      hint: "按住吹口起三孔，再点吹口或空格吹气",
      toast: "按三孔 · 对准再吹"
    },
    {
      name: "山月", sub: "HILL", phrase: "山月", notes: [5, 2],
      time: 30, listens: 2, hintHoles: 1, hintDots: 1, preview: 1, leakMark: 1, demo: 1,
      hint: "山低月高 · 换孔后再吹下一字",
      toast: "山月 · 先低后高"
    },
    {
      name: "江月", sub: "RIVER", phrase: "江上月", notes: [4, 3, 1],
      time: 32, listens: 2, hintHoles: 0.85, hintDots: 1, preview: 1, leakMark: 1, demo: 1,
      hint: "三字上行。从吹口连着按，不要跳着按",
      toast: "江上月 · 一句三音"
    },
    {
      name: "漏孔", sub: "LEAK", phrase: "风入松", notes: [2, 6, 4],
      time: 34, listens: 2, hintHoles: 0.7, hintDots: 1, preview: 1, leakMark: 1, demo: 0,
      hint: "入要按满。中间漏了，音会偏高",
      toast: "漏孔会偏高 · 从吹口连按"
    },
    {
      name: "春风", sub: "SPRING", phrase: "春风又绿", notes: [3, 2, 4, 1],
      time: 34, listens: 1, hintHoles: 0.35, hintDots: 1, preview: 1, leakMark: 0,
      hint: "四字短句。指法光淡了，看字下的点",
      toast: "春风又绿 · 看点按孔"
    },
    {
      name: "夜钟", sub: "NIGHT", phrase: "夜半钟声", notes: [5, 3, 6, 4],
      time: 32, listens: 1, hintHoles: 0, hintDots: 0, preview: 1, leakMark: 0,
      hint: "无指法点。听句，或看顶栏要按几孔",
      toast: "夜半钟声 · 凭听与顶栏"
    },
    {
      name: "珠落", sub: "PEARL", phrase: "大珠小珠落", notes: [1, 3, 2, 4, 6],
      time: 30, listens: 1, hintHoles: 0, hintDots: 0, preview: 0, leakMark: 0,
      hint: "五音起伏。落要按满。顶栏不再报现孔名",
      toast: "大珠小珠落 · 气要稳"
    },
    {
      name: "愁眠", sub: "SLEEP", phrase: "江枫渔火对愁眠", notes: [4, 3, 5, 2, 3, 1, 6],
      time: 36, listens: 1, hintHoles: 0, hintDots: 0, preview: 0, leakMark: 0,
      hint: "长句。眠是满孔。听一次就要记住",
      toast: "江枫渔火 · 一句七音"
    },
    {
      name: "霜天", sub: "FROST", phrase: "月落乌啼霜满天", notes: [1, 6, 4, 2, 5, 3, 0],
      time: 34, listens: 0, hintHoles: 0, hintDots: 0, preview: 0, leakMark: 0,
      hint: "终句无再听。天是全开，X 松开再吹",
      toast: "霜满天 · 终句全开收"
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
  const btnListen = document.getElementById("btn-listen");
  const stageLabel = document.getElementById("stage-label");
  const pitchLabel = document.getElementById("pitch-label");
  const timeLabel = document.getElementById("time-label");
  const pipsEl = document.getElementById("pips");
  const toastEl = document.getElementById("toast");
  const hintEl = document.getElementById("hint");
  const fillWrap = document.getElementById("fill-wrap");
  const fillBar = document.getElementById("fill-bar");
  const fillNum = document.getElementById("fill-num");

  const coarse = window.matchMedia("(pointer: coarse)").matches;

  let W = 1;
  let H = 1;
  let dpr = 1;

  const L = {
    y: 0,
    r: 16,
    x0: 0,
    x1: 1,
    blow: { x: 0, y: 0, rx: 16, ry: 10 },
    mo: { x: 0, y: 0, r: 6 },
    end: { x: 0, y: 0, r: 8 },
    holes: [],
    chars: [],
    phraseY: 0,
    moonX: 0,
    moonY: 0
  };

  const G = {
    mode: "title",
    stage: 0,
    lives: LIVES,
    remain: 32,
    cursor: 0,
    faults: 0,
    listens: 0,
    lock: 0,
    t: 0,
    clock: 0,
    shake: 0,
    flash: 0,
    flashCol: PINK,
    toastT: 0,
    blowT: 0,
    blowPitch: 3,
    blowOk: false,
    clearT: 0,
    judge: "",
    judgeCol: CYAN,
    judgeT: 0,
    hover: -2,
    paused: false,
    spec: STAGES[0],
    listenI: -1,
    listenWait: 0,
    demoI: -1,
    demoWait: 0,
    ready: false,
    lastHud: "",
    membrane: 0
  };

  const held = [false, false, false, false, false, false];
  const sticky = [false, false, false, false, false, false];
  const holePulse = [0, 0, 0, 0, 0, 0];
  const motes = [];
  const particles = [];
  const ripples = [];
  const floats = [];
  const breaths = [];

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function smooth(t) {
    t = clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function hexRgb(h) {
    return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  }
  function rgba(h, a) {
    const c = hexRgb(h);
    return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")";
  }
  function mixHex(a, b, t) {
    const A = hexRgb(a);
    const B = hexRgb(b);
    return {
      r: (A[0] + (B[0] - A[0]) * t) | 0,
      g: (A[1] + (B[1] - A[1]) * t) | 0,
      b: (A[2] + (B[2] - A[2]) * t) | 0
    };
  }
  function pitchCol(p) {
    return mixHex(PINK, CYAN, clamp(p / 6, 0, 1));
  }

  function covered(i) {
    return !!(held[i] || sticky[i]);
  }

  function fingering() {
    for (let i = 0; i < HOLES; i++) {
      if (!covered(i)) return i;
    }
    return HOLES;
  }

  function leaking() {
    const first = fingering();
    if (first >= HOLES) return false;
    for (let i = first + 1; i < HOLES; i++) {
      if (covered(i)) return true;
    }
    return false;
  }

  function targetNote() {
    const s = G.spec;
    if (!s) return 3;
    return s.notes[Math.min(G.cursor, s.notes.length - 1)];
  }

  const audio = {
    ctx: null,
    master: null,
    drone: null,
    droneGain: null,
    noise: null,
    muted: false,
    ensure: function () {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.32;
        this.master.connect(this.ctx.destination);
        const n = (this.ctx.sampleRate * 0.45) | 0;
        this.noise = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
        const d = this.noise.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
    },
    setMuted: function (m) {
      this.muted = m;
      try {
        localStorage.setItem(MUTE_KEY, m ? "1" : "0");
      } catch (e) {}
      if (this.master) this.master.gain.value = m ? 0 : 0.32;
      btnMute.textContent = m ? "静" : "声";
      btnMute.setAttribute("aria-label", m ? "取消静音" : "静音");
      btnMute.classList.toggle("muted", m);
    },
    tone: function (freq, dur, type, vol, when, slide) {
      if (!this.ctx || this.muted) return;
      const t = when != null ? when : this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || "sine";
      o.frequency.setValueAtTime(Math.max(40, freq), t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.018);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + dur + 0.04);
    },
    breath: function (hz, dur, vol, when) {
      if (!this.ctx || this.muted || !this.noise) return;
      const t = when != null ? when : this.ctx.currentTime;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noise;
      const bp = this.ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.setValueAtTime(hz, t);
      bp.Q.value = 3.6;
      const hp = this.ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 400;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(hp);
      hp.connect(bp);
      bp.connect(g);
      g.connect(this.master);
      src.start(t);
      src.stop(t + dur + 0.02);
    },
    flute: function (hz, ok) {
      this.ensure();
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const dur = ok ? 0.58 : 0.3;
      this.tone(hz, dur, "sine", ok ? 0.17 : 0.1, t);
      this.tone(hz * 2, dur * 0.72, "sine", ok ? 0.055 : 0.03, t);
      this.tone(hz * 3, dur * 0.38, "triangle", 0.018, t);
      this.breath(hz * 1.15, dur * 0.85, ok ? 0.07 : 0.045, t);
      if (ok) this.tone(hz * 1.5, 0.16, "sine", 0.03, t + 0.04);
    },
    tap: function () {
      this.ensure();
      this.tone(720, 0.06, "sine", 0.03);
      this.breath(1400, 0.07, 0.02);
    },
    miss: function () {
      this.ensure();
      this.tone(174, 0.28, "square", 0.06, null, 70);
      this.tone(92, 0.4, "sawtooth", 0.045, null, 48);
    },
    hit: function (hz) {
      this.flute(hz, true);
    },
    wrong: function (hz) {
      this.flute(hz, false);
      const t = this.ctx ? this.ctx.currentTime : 0;
      this.tone(196, 0.18, "triangle", 0.04, t + 0.08, 90);
    },
    clear: function () {
      this.ensure();
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const seq = [392, 494, 587, 784];
      for (let i = 0; i < seq.length; i++) {
        this.tone(seq[i], 0.22, i % 2 ? "triangle" : "sine", 0.08, t + i * 0.09);
      }
    },
    win: function () {
      this.ensure();
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const seq = [392, 494, 587, 659, 784, 988];
      for (let i = 0; i < seq.length; i++) {
        this.tone(seq[i], 0.32, i % 2 ? "triangle" : "sine", 0.09, t + i * 0.12);
      }
    },
    lose: function () {
      this.ensure();
      this.tone(220, 0.5, "sawtooth", 0.08, null, 70);
      this.tone(110, 0.7, "square", 0.05, null, 48);
    },
    start: function () {
      this.ensure();
      this.tone(196, 0.16, "sine", 0.07, null, 392);
      this.tone(330, 0.22, "triangle", 0.05, null, 659);
    },
    life: function () {
      this.ensure();
      this.tone(247, 0.2, "square", 0.06, null, 110);
    },
    cue: function (p, when) {
      this.ensure();
      if (!this.ctx || this.muted) return;
      const hz = SCALE[p].hz;
      const t = when != null ? when : this.ctx.currentTime;
      this.tone(hz, 0.34, "sine", 0.11, t);
      this.tone(hz * 2, 0.2, "sine", 0.03, t);
    },
    tickDrone: function () {
      if (!this.ctx || this.muted) return;
      if (!this.drone) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = "sine";
        o.frequency.value = 98;
        g.gain.value = 0.0001;
        o.connect(g);
        g.connect(this.master);
        o.start();
        this.drone = o;
        this.droneGain = g;
      }
      const t = this.ctx.currentTime;
      const play = G.mode === "play" || G.mode === "clear";
      this.drone.frequency.setTargetAtTime(play ? 98 : 82, t, 0.28);
      this.droneGain.gain.setTargetAtTime(play ? 0.016 : 0.007, t, 0.28);
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === "1") audio.setMuted(true);
  } catch (e) {}

  function makeMotes() {
    motes.length = 0;
    const n = 58;
    for (let i = 0; i < n; i++) {
      motes.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.5 + 0.25,
        a: Math.random() * 0.34 + 0.04,
        p: Math.random() * TAU,
        s: 0.06 + Math.random() * 0.26,
        kind: i % 7 === 0 ? 1 : 0
      });
    }
  }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 130) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life,
        max: spec.life,
        rad: rand(spec.r0, spec.r1),
        r: spec.col.r,
        g: spec.col.g,
        b: spec.col.b,
        tx: spec.tx,
        ty: spec.ty
      });
    }
  }

  function ripple(x, y, col, max) {
    if (ripples.length > 14) ripples.shift();
    ripples.push({ x: x, y: y, t: 1, col: col, max: max || 36 });
  }

  function floatAt(x, y, text, col) {
    if (floats.length > 8) floats.shift();
    floats.push({ x: x, y: y, text: text, col: col, t: 1 });
  }

  function puffBreath(ok) {
    const b = L.blow;
    for (let i = 0; i < 10; i++) {
      if (breaths.length > 40) breaths.shift();
      breaths.push({
        x: b.x - b.rx * 0.2,
        y: b.y + rand(-3, 3),
        vx: rand(40, 110),
        vy: rand(-18, 18),
        life: rand(0.22, 0.5),
        max: 0.5,
        r: rand(2, 5),
        ok: ok
      });
    }
  }

  function toast(msg, kind) {
    toastEl.textContent = msg;
    toastEl.classList.toggle("warn", kind === "warn");
    toastEl.classList.toggle("gold", kind === "gold");
    toastEl.classList.remove("hidden");
    G.toastT = 2.1;
  }

  function judge(text, col) {
    G.judge = text;
    G.judgeCol = col;
    G.judgeT = 0.7;
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
  }

  function showOverlay(kind) {
    overlay.classList.remove("hidden");
    panel.classList.remove("win", "lose");
    if (kind === "title") {
      ovKicker.textContent = "FLUTE";
      ovTitle.textContent = "笛孔";
      ovLead.innerHTML = "从吹口连着按孔，对准高亮的字再吹。<br />中间漏了，音会偏高。";
      ovOps.textContent = "点孔开关 · 1–6 / ASDFJK 按住 · 空格吹 · X 松开 · M 静音";
      ovBtn.textContent = "启唇";
    } else if (kind === "win") {
      panel.classList.add("win");
      ovKicker.textContent = "FULL";
      ovTitle.textContent = "曲满";
      ovLead.textContent = "九句都吹准了。江月还在笛管里。";
      ovOps.textContent = "余命 " + G.lives + " · 九句吹满";
      ovBtn.textContent = "再吹一次";
    } else {
      panel.classList.add("lose");
      ovKicker.textContent = "BREATH";
      ovTitle.textContent = "气散";
      ovLead.textContent = "偏了，或气尽了。再按一次孔。";
      ovOps.textContent = STAGES[G.stage].name + " · 已成 " + G.stage + " 句";
      ovBtn.textContent = "再来一局";
    }
  }

  function syncPips() {
    const bits = [];
    for (let i = 0; i < LIVES; i++) {
      const on = i < G.lives;
      bits.push(
        '<i class="pip' +
          (on ? " on" : "") +
          (on && G.lives === 1 ? " warn" : "") +
          '"></i>'
      );
    }
    pipsEl.innerHTML = bits.join("");
  }

  function syncHud(force) {
    const s = G.spec || STAGES[0];
    const need = s.notes.length;
    const got = G.mode === "play" || G.mode === "clear" ? G.cursor : 0;
    const p = fingering();
    const want = targetNote();
    const ready = G.mode === "play" && p === want;
    const leak = leaking();
    const key =
      G.mode +
      "|" +
      G.stage +
      "|" +
      got +
      "|" +
      need +
      "|" +
      G.lives +
      "|" +
      p +
      "|" +
      want +
      "|" +
      (G.remain | 0) +
      "|" +
      G.listens +
      "|" +
      (ready ? 1 : 0) +
      "|" +
      G.faults;
    if (!force && key === G.lastHud) return;
    G.lastHud = key;
    G.ready = ready;

    stageLabel.textContent = s.name + " · " + (G.stage + 1) + "/" + STAGES.length;
    stageLabel.classList.toggle("hot", G.mode === "clear");

    const frac = need ? got / need : 0;
    fillBar.style.transform = "scaleX(" + clamp(frac, 0, 1) + ")";
    fillNum.textContent = got + "/" + need;
    fillWrap.classList.toggle("hot", frac >= 1 || G.mode === "clear");
    fillWrap.classList.toggle("warn", G.faults > 0 && G.mode === "play");

    if (G.mode === "play") {
      if (ready) pitchLabel.textContent = "对上 · 吹";
      else if (s.preview) {
        pitchLabel.textContent = "要" + SCALE[want].short + " · 现" + SCALE[p].short;
      } else pitchLabel.textContent = leak ? "有漏" : "按孔";
    } else if (G.mode === "clear") pitchLabel.textContent = "成句";
    else pitchLabel.textContent = "孔 —";
    pitchLabel.classList.toggle("hot", ready);
    pitchLabel.classList.toggle("warn", G.mode === "play" && leak && !ready);

    const t = Math.max(0, Math.ceil(G.remain));
    timeLabel.textContent = G.mode === "play" ? t + "s" : "—";
    timeLabel.classList.toggle("warn", G.mode === "play" && G.remain < 7);

    btnListen.disabled = G.mode !== "play" || G.listens <= 0 || G.listenI >= 0;
    btnListen.textContent = G.listens > 0 ? "听 " + G.listens : "听";
    syncPips();
  }

  function layout() {
    const padX = Math.max(16, W * 0.05);
    L.x0 = padX;
    L.x1 = W - padX;
    L.y = H * (H > W * 1.05 ? 0.6 : 0.64);
    L.r = clamp(Math.min(W, H) * 0.028, 10, 20);
    L.phraseY = clamp(H * 0.28, 72, H * 0.36);
    L.moonX = W * 0.82;
    L.moonY = H * 0.16;

    const tube = L.x1 - L.x0;
    L.blow.x = L.x0 + tube * 0.09;
    L.blow.y = L.y;
    L.blow.rx = L.r * 1.15;
    L.blow.ry = L.r * 0.72;

    L.mo.x = L.x0 + tube * 0.2;
    L.mo.y = L.y;
    L.mo.r = L.r * 0.42;

    const h0 = L.x0 + tube * 0.32;
    const h1 = L.x1 - tube * 0.1;
    L.holes = [];
    for (let i = 0; i < HOLES; i++) {
      const u = HOLES === 1 ? 0.5 : i / (HOLES - 1);
      L.holes.push({
        x: lerp(h0, h1, u),
        y: L.y,
        r: clamp(L.r * 0.78, 9, 16)
      });
    }
    L.end.x = L.x1 - L.r * 0.2;
    L.end.y = L.y;
    L.end.r = L.r * 0.7;

    const s = G.spec || STAGES[0];
    const n = s.phrase.length;
    const span = Math.min(W * 0.84, 72 * n);
    const cell = span / n;
    const x0 = (W - span) / 2 + cell * 0.5;
    L.chars = [];
    for (let i = 0; i < n; i++) {
      L.chars.push({
        x: x0 + i * cell,
        y: L.phraseY,
        ch: s.phrase[i],
        note: s.notes[i]
      });
    }
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
    layout();
  }

  function clearFingers() {
    for (let i = 0; i < HOLES; i++) sticky[i] = false;
  }

  function resetFingers() {
    for (let i = 0; i < HOLES; i++) {
      sticky[i] = false;
      holePulse[i] = 0;
    }
  }

  function loadStage(index) {
    const s = STAGES[index];
    G.stage = index;
    G.spec = s;
    G.cursor = 0;
    G.faults = 0;
    G.remain = s.time;
    G.lock = 0.28;
    G.clearT = 0;
    G.listenI = -1;
    G.listenWait = 0;
    G.demoI = s.demo ? 0 : -1;
    G.demoWait = s.demo ? 0.45 : 0;
    G.listens = s.listens;
    G.blowT = 0;
    G.judgeT = 0;
    G.mode = "play";
    resetFingers();
    layout();
    toast(s.toast);
    hintEl.textContent = s.hint;
    hintEl.classList.remove("hot", "warn");
    syncHud(true);
  }

  function startRun() {
    G.lives = LIVES;
    G.shake = 0;
    G.flash = 0;
    G.paused = false;
    hideOverlay();
    loadStage(0);
    audio.start();
  }

  function retryStage() {
    if (G.mode === "title") {
      startRun();
      return;
    }
    if (G.mode === "win" || G.mode === "lose") {
      startRun();
      return;
    }
    loadStage(G.stage);
    toast("重吹本句");
  }

  function stageClear() {
    G.mode = "clear";
    G.clearT = 1.05;
    G.lock = 1;
    audio.clear();
    G.flash = 0.3;
    G.flashCol = GOLD;
    hintEl.classList.add("hot");
    hintEl.classList.remove("warn");
    toast("成句", "gold");
    const ch = L.chars[L.chars.length - 1];
    if (ch) {
      emit(22, {
        x: ch.x,
        y: ch.y,
        j: 22,
        vx0: -80,
        vx1: 80,
        vy0: -140,
        vy1: -20,
        life: 0.7,
        r0: 1.2,
        r1: 3.4,
        col: mixHex(GOLD, CYAN, 0.4)
      });
    }
    syncHud(true);
  }

  function loseLife(reason) {
    G.lives -= 1;
    audio.life();
    G.flash = 0.34;
    G.flashCol = PINK;
    G.shake = 10;
    hintEl.classList.add("warn");
    if (G.lives <= 0) {
      G.mode = "lose";
      showOverlay("lose");
      audio.lose();
      syncHud(true);
      return;
    }
    loadStage(G.stage);
    toast(reason || "气偏了 · 命 -1", "warn");
  }

  function applyHit(p) {
    const s = G.spec;
    const ch = L.chars[G.cursor];
    G.cursor += 1;
    G.faults = 0;
    G.flash = 0.16;
    G.flashCol = GOLD;
    judge("准", GOLD);
    if (ch) {
      floatAt(ch.x, ch.y - 36, "准", GOLD);
      ripple(ch.x, ch.y, GOLD, 48);
      emit(14, {
        x: ch.x,
        y: ch.y,
        j: 10,
        vx0: -40,
        vx1: 40,
        vy0: -120,
        vy1: -40,
        life: 0.55,
        r0: 1.1,
        r1: 2.8,
        col: mixHex(GOLD, CYAN, 0.5)
      });
    }
    const h = soundPos(p);
    ripple(h.x, h.y, CYAN, 30);
    if (G.cursor >= s.notes.length) {
      G.cursor = s.notes.length;
      stageClear();
    } else {
      toast(s.phrase[G.cursor], "gold");
    }
    syncHud(true);
  }

  function applyMiss(played, want) {
    G.faults += 1;
    G.flash = 0.22;
    G.flashCol = PINK;
    G.shake = 6;
    const leak = leaking();
    let word = "偏";
    if (leak && played < want) word = "漏孔";
    else if (played < want) word = "偏高";
    else if (played > want) word = "偏低";
    judge(word, PINK);
    const ch = L.chars[G.cursor];
    if (ch) floatAt(ch.x, ch.y - 34, word, PINK);
    hintEl.classList.add("warn");
    if (G.faults >= FAULTS) {
      loseLife(word + "两次 · 命 -1");
      return;
    }
    toast(word + " · 还可一偏", "warn");
    syncHud(true);
  }

  function soundPos(p) {
    if (p >= HOLES) return { x: L.end.x, y: L.end.y };
    const h = L.holes[p];
    return { x: h.x, y: h.y };
  }

  function blow() {
    if (G.mode === "title") {
      audio.ensure();
      startRun();
      return;
    }
    if (G.mode === "win" || G.mode === "lose") {
      audio.ensure();
      startRun();
      return;
    }
    if (G.mode !== "play" || G.lock > 0 || G.paused) return;
    if (G.listenI >= 0 || G.demoI >= 0) return;

    const p = fingering();
    const want = targetNote();
    const ok = p === want;
    const hz = SCALE[p].hz;
    G.blowT = ok ? 0.55 : 0.32;
    G.blowPitch = p;
    G.blowOk = ok;
    G.membrane = 1;
    G.lock = ok ? 0.22 : 0.34;
    puffBreath(ok);

    const sp = soundPos(p);
    emit(ok ? 16 : 8, {
      x: sp.x,
      y: sp.y,
      j: 8,
      vx0: -30,
      vx1: 70,
      vy0: -70,
      vy1: -10,
      life: 0.45,
      r0: 1,
      r1: 2.6,
      col: ok ? mixHex(CYAN, GOLD, 0.4) : mixHex(PINK, GOLD, 0.2)
    });

    if (ok) {
      audio.hit(hz);
      applyHit(p);
    } else {
      audio.wrong(hz);
      applyMiss(p, want);
    }
  }

  function toggleHole(i) {
    if (G.mode !== "play" && G.mode !== "title") return;
    if (i < 0 || i >= HOLES) return;
    sticky[i] = !sticky[i];
    holePulse[i] = 1;
    audio.tap();
    const h = L.holes[i];
    if (h) ripple(h.x, h.y, sticky[i] ? PINK : CYAN, 22);
    syncHud(true);
  }

  function hitHole(x, y) {
    let best = -1;
    let bestD = 1e9;
    for (let i = 0; i < HOLES; i++) {
      const h = L.holes[i];
      const slop = Math.max(h.r * (coarse ? 2.35 : 1.8), coarse ? 26 : 18);
      const dx = x - h.x;
      const dy = y - h.y;
      const d = dx * dx + dy * dy;
      if (d <= slop * slop && d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }

  function hitBlow(x, y) {
    const b = L.blow;
    const dx = (x - b.x) / (b.rx * (coarse ? 3.1 : 2.4));
    const dy = (y - (b.y - 8)) / (b.ry * (coarse ? 4.4 : 3.4));
    return dx * dx + dy * dy <= 1;
  }

  function canvasPos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function startListen() {
    if (G.mode !== "play" || G.listens <= 0 || G.listenI >= 0 || G.demoI >= 0) return;
    G.listens -= 1;
    G.listenI = 0;
    G.listenWait = 0.12;
    G.lock = 0.2;
    toast("听句");
    syncHud(true);
    audio.ensure();
  }

  function playCue(index) {
    const s = G.spec;
    if (!s || index < 0 || index >= s.notes.length) return;
    const p = s.notes[index];
    audio.cue(p);
    const ch = L.chars[index];
    if (ch) ripple(ch.x, ch.y, CYAN, 36);
    for (let i = 0; i < HOLES; i++) {
      if (i < p) holePulse[i] = 0.85;
    }
    G.membrane = 0.55;
    puffBreath(true);
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

  function drawMoon() {
    const x = L.moonX;
    const y = L.moonY;
    const r = clamp(Math.min(W, H) * 0.055, 16, 28);
    const g = ctx.createRadialGradient(x - r * 0.2, y - r * 0.25, r * 0.2, x, y, r * 2.4);
    g.addColorStop(0, rgba(GOLD, 0.22));
    g.addColorStop(0.35, rgba(GOLD, 0.06));
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r * 2.4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.78);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#05030c";
    ctx.beginPath();
    ctx.arc(x + r * 0.38, y - r * 0.08, r * 0.82, 0, TAU);
    ctx.fill();
  }

  function drawMotes() {
    const t = G.t;
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const x = (m.x + Math.sin(t * m.s + m.p) * 0.03) * W;
      const y = ((m.y + t * m.s * 0.03) % 1) * H;
      ctx.fillStyle = m.kind
        ? rgba(GOLD, m.a * 0.7)
        : rgba(i % 2 ? CYAN : PINK, m.a);
      ctx.beginPath();
      ctx.arc(x, y, m.r, 0, TAU);
      ctx.fill();
    }
  }

  function drawPhrase() {
    const s = G.spec;
    if (!s || !L.chars.length) return;
    const n = L.chars.length;
    const size = clamp(Math.min(64, (W * 0.78) / n), 28, 64);
    for (let i = 0; i < n; i++) {
      const c = L.chars[i];
      let col = rgba("#8b90b8", 0.7);
      let glow = 0;
      let sc = 1;
      if (G.mode === "title") {
        col = rgba(CYAN, 0.45 + 0.2 * Math.sin(G.t * 2 + i));
      } else if (i < G.cursor) {
        col = GOLD;
        glow = 0.45;
      } else if (i === G.cursor && (G.mode === "play" || G.mode === "clear")) {
        sc = 1 + 0.045 * Math.sin(G.t * 5.2);
        col = G.ready ? GOLD : "#f6f3ff";
        glow = G.ready ? 0.7 : 0.35;
        if (G.listenI === i || G.demoI === i) {
          col = CYAN;
          glow = 0.8;
        }
      }
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.scale(sc, sc);
      if (glow) {
        ctx.shadowColor = col === GOLD || col === "#ffe36b" ? rgba(GOLD, 0.7) : rgba(CYAN, 0.55);
        ctx.shadowBlur = 18;
      }
      ctx.fillStyle = col;
      ctx.font = "900 " + size + "px 'PingFang SC','Noto Sans SC','Microsoft YaHei',sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(c.ch, 0, 0);
      ctx.restore();

      if (s.hintDots && G.mode !== "title") {
        const cover = c.note;
        const dotR = Math.max(2.2, size * 0.07);
        const gap = dotR * 2.5;
        const w = gap * 5;
        const y = size * 0.62;
        for (let k = 0; k < HOLES; k++) {
          const on = k < cover;
          const x = -w / 2 + k * gap;
          ctx.beginPath();
          ctx.arc(c.x + x, c.y + y, dotR, 0, TAU);
          if (on) {
            ctx.fillStyle = i < G.cursor ? rgba(GOLD, 0.85) : i === G.cursor ? rgba(PINK, 0.95) : rgba(CYAN, 0.45);
            ctx.fill();
          } else {
            ctx.strokeStyle = rgba(CYAN, i === G.cursor ? 0.55 : 0.22);
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
    }
  }

  function drawFlute() {
    const y = L.y;
    const r = L.r;
    const x0 = L.x0;
    const x1 = L.x1;
    const blowGlow = G.blowT > 0 ? G.blowT / 0.55 : 0;
    const ready = G.ready && G.mode === "play";

    ctx.save();
    ctx.shadowColor = rgba(CYAN, 0.18 + blowGlow * 0.25);
    ctx.shadowBlur = 18;
    const body = ctx.createLinearGradient(x0, y - r, x1, y + r);
    body.addColorStop(0, "#1a0c24");
    body.addColorStop(0.18, "#2a1438");
    body.addColorStop(0.5, "#140a22");
    body.addColorStop(1, "#1c102c");
    ctx.fillStyle = body;
    roundRect(x0, y - r, x1 - x0, r * 2, r);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = rgba(CYAN, 0.45 + blowGlow * 0.35);
    ctx.lineWidth = 1.4;
    roundRect(x0, y - r, x1 - x0, r * 2, r);
    ctx.stroke();

    const shine = ctx.createLinearGradient(x0, y - r, x0, y);
    shine.addColorStop(0, "rgba(255,255,255,0.16)");
    shine.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = shine;
    roundRect(x0 + 4, y - r + 2, x1 - x0 - 8, r * 0.55, r * 0.5);
    ctx.fill();

    const nodes = [0.16, 0.48, 0.78];
    for (let i = 0; i < nodes.length; i++) {
      const nx = lerp(x0, x1, nodes[i]);
      ctx.fillStyle = rgba(PINK, 0.22);
      ctx.fillRect(nx - 2, y - r, 4, r * 2);
      ctx.strokeStyle = rgba(PINK, 0.45);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(nx - 2, y - r);
      ctx.lineTo(nx - 2, y + r);
      ctx.moveTo(nx + 2, y - r);
      ctx.lineTo(nx + 2, y + r);
      ctx.stroke();
    }

    // blow hole
    const b = L.blow;
    ctx.beginPath();
    ctx.ellipse(b.x, b.y, b.rx, b.ry, 0, 0, TAU);
    ctx.fillStyle = ready ? rgba(GOLD, 0.55) : rgba("#05030c", 0.92);
    ctx.fill();
    ctx.strokeStyle = ready ? GOLD : blowGlow > 0 ? CYAN : rgba(CYAN, 0.7);
    ctx.lineWidth = ready ? 2.2 : 1.5;
    ctx.stroke();
    if (ready || blowGlow > 0) {
      ctx.beginPath();
      ctx.ellipse(b.x, b.y, b.rx + 6 + blowGlow * 8, b.ry + 5 + blowGlow * 6, 0, 0, TAU);
      ctx.strokeStyle = rgba(ready ? GOLD : CYAN, 0.28 + blowGlow * 0.4);
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    ctx.fillStyle = rgba(GOLD, 0.85);
    ctx.font = "700 " + Math.max(10, r * 0.7) + "px 'PingFang SC','Noto Sans SC',sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText("吹", b.x, b.y - b.ry - 6);

    // membrane hole
    const mo = L.mo;
    const mem = G.membrane;
    ctx.beginPath();
    ctx.arc(mo.x, mo.y, mo.r, 0, TAU);
    ctx.fillStyle = rgba(PINK, 0.18 + mem * 0.45);
    ctx.fill();
    ctx.strokeStyle = rgba(PINK, 0.55 + mem * 0.4);
    ctx.lineWidth = 1.1;
    ctx.stroke();
    if (mem > 0.2) {
      ctx.beginPath();
      ctx.arc(mo.x, mo.y, mo.r + 3 + mem * 5, 0, TAU);
      ctx.strokeStyle = rgba(PINK, mem * 0.45);
      ctx.stroke();
    }

    const want = targetNote();
    const pNow = fingering();
    const hintAmt = G.mode === "play" ? G.spec.hintHoles : 0;
    const leakOn = G.mode === "play" && G.spec.leakMark && leaking();
    const ghost = G.listenI >= 0
      ? G.spec.notes[G.listenI]
      : G.demoI >= 0
        ? G.spec.notes[G.demoI]
        : -1;

    for (let i = 0; i < HOLES; i++) {
      const h = L.holes[i];
      const on = covered(i);
      const should = ghost >= 0 ? i < ghost : G.mode === "play" && hintAmt > 0 && i < want;
      const pulse = holePulse[i];
      const hover = G.hover === i;
      const rad = h.r + pulse * 2 + (hover ? 1.2 : 0);

      if (should && !on) {
        const a = 0.25 + 0.35 * hintAmt * (0.5 + 0.5 * Math.sin(G.t * 4.2 + i));
        ctx.beginPath();
        ctx.arc(h.x, h.y, rad + 5, 0, TAU);
        ctx.strokeStyle = rgba(CYAN, a);
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(h.x, h.y, rad, 0, TAU);
      if (on) {
        const g2 = ctx.createRadialGradient(h.x - 2, h.y - 2, 1, h.x, h.y, rad);
        g2.addColorStop(0, "#ff9ad4");
        g2.addColorStop(1, PINK);
        ctx.fillStyle = g2;
        ctx.fill();
        ctx.shadowColor = rgba(PINK, 0.7);
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = "#05030c";
        ctx.fill();
        ctx.strokeStyle = hover ? GOLD : rgba(CYAN, 0.7);
        ctx.lineWidth = hover ? 2 : 1.3;
        ctx.stroke();
      }

      const leakHole = leakOn && i === pNow;
      if (leakHole) {
        ctx.beginPath();
        ctx.arc(h.x, h.y, rad + 6, 0, TAU);
        ctx.strokeStyle = rgba(PINK, 0.7);
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }

      ctx.fillStyle = on ? "#fff" : rgba("#c9c6e8", 0.75);
      ctx.font = "600 " + Math.max(9, h.r * 0.7) + "px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(coarse ? KEY_LABEL[i] : KEY_LABEL[i] + "/" + KEY_ALT[i], h.x, h.y + h.r + 6);
    }

    // sounding marker
    const sp = soundPos(pNow);
    if (G.mode === "play" || G.mode === "title") {
      const col = G.ready ? GOLD : leakOn ? PINK : CYAN;
      const rr = 7 + 3 * Math.sin(G.t * 5);
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, rr, 0, TAU);
      ctx.strokeStyle = rgba(col, 0.55);
      ctx.lineWidth = 1.3;
      ctx.stroke();
      if (G.mode === "play" && G.spec.preview) {
        ctx.fillStyle = rgba(col, 0.95);
        ctx.font = "700 12px 'PingFang SC','Noto Sans SC',sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(SCALE[pNow].name, sp.x, sp.y - (pNow >= HOLES ? L.end.r : L.holes[pNow].r) - 10);
      }
    }

    // end opening
    ctx.beginPath();
    ctx.ellipse(L.end.x, L.end.y, L.end.r * 0.45, L.end.r, 0, 0, TAU);
    ctx.fillStyle = rgba("#05030c", 0.85);
    ctx.fill();
    ctx.strokeStyle = rgba(CYAN, 0.4);
    ctx.lineWidth = 1.1;
    ctx.stroke();

    ctx.restore();
  }

  function drawBreaths() {
    for (let i = 0; i < breaths.length; i++) {
      const b = breaths[i];
      const a = b.life / b.max;
      ctx.fillStyle = b.ok ? rgba(CYAN, a * 0.45) : rgba(PINK, a * 0.4);
      ctx.beginPath();
      ctx.ellipse(b.x, b.y, b.r * (1.4 - a * 0.4), b.r * a, 0, 0, TAU);
      ctx.fill();
    }
  }

  function drawFx() {
    for (let i = 0; i < ripples.length; i++) {
      const r = ripples[i];
      ctx.beginPath();
      ctx.arc(r.x, r.y, (1 - r.t) * r.max, 0, TAU);
      ctx.strokeStyle = rgba(r.col, r.t * 0.7);
      ctx.lineWidth = 1.6 * r.t;
      ctx.stroke();
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = p.life / p.max;
      ctx.fillStyle = "rgba(" + p.r + "," + p.g + "," + p.b + "," + a + ")";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.rad * (0.4 + a), 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      ctx.globalAlpha = f.t;
      ctx.fillStyle = f.col;
      ctx.font = "800 16px 'PingFang SC','Noto Sans SC',sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(f.text, f.x, f.y);
      ctx.globalAlpha = 1;
    }
    if (G.judgeT > 0 && G.judge) {
      ctx.globalAlpha = Math.min(1, G.judgeT * 2);
      ctx.fillStyle = G.judgeCol;
      ctx.font = "900 28px 'PingFang SC','Noto Sans SC',sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = G.judgeCol;
      ctx.shadowBlur = 16;
      ctx.fillText(G.judge, W * 0.5, L.phraseY - 52);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
  }

  function draw() {
    ctx.fillStyle = "#03010a";
    ctx.fillRect(0, 0, W, H);

    const vg = ctx.createRadialGradient(W * 0.5, H * 0.4, 20, W * 0.5, H * 0.5, Math.max(W, H) * 0.75);
    vg.addColorStop(0, "rgba(20,10,40,0.35)");
    vg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    if (G.shake > 0.4) {
      ctx.translate((Math.random() - 0.5) * G.shake, (Math.random() - 0.5) * G.shake);
    }
    drawMotes();
    drawMoon();
    drawPhrase();
    drawFlute();
    drawBreaths();
    drawFx();
    ctx.restore();

    if (G.flash > 0) {
      const rgb = hexRgb(G.flashCol);
      ctx.fillStyle = "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + "," + G.flash * 0.22 + ")";
      ctx.fillRect(0, 0, W, H);
    }
  }

  function stepListen(dt) {
    if (G.demoI >= 0) {
      G.demoWait -= dt;
      if (G.demoWait <= 0) {
        playCue(G.demoI);
        G.demoI += 1;
        if (G.demoI >= G.spec.notes.length) {
          G.demoI = -1;
          G.lock = 0.15;
        } else G.demoWait = 0.42;
      }
      return;
    }
    if (G.listenI < 0) return;
    G.listenWait -= dt;
    if (G.listenWait <= 0) {
      playCue(G.listenI);
      G.listenI += 1;
      if (G.listenI >= G.spec.notes.length) {
        G.listenI = -1;
        G.lock = 0.12;
        syncHud(true);
      } else G.listenWait = 0.4;
    }
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    G.lock = Math.max(0, G.lock - dt);
    G.shake = Math.max(0, G.shake - dt * 28);
    G.flash = Math.max(0, G.flash - dt * 1.8);
    G.toastT -= dt;
    if (G.toastT <= 0) toastEl.classList.add("hidden");
    G.blowT = Math.max(0, G.blowT - dt);
    G.judgeT = Math.max(0, G.judgeT - dt);
    G.membrane = Math.max(0, G.membrane - dt * 1.6);
    for (let i = 0; i < HOLES; i++) holePulse[i] = Math.max(0, holePulse[i] - dt * 3.2);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.tx != null) {
        p.vx += (p.tx - p.x) * dt * 2;
        p.vy += (p.ty - p.y) * dt * 2;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 40 * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      ripples[i].t -= dt * 1.6;
      if (ripples[i].t <= 0) ripples.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t -= dt * 1.15;
      f.y -= 28 * dt;
      if (f.t <= 0) floats.splice(i, 1);
    }
    for (let i = breaths.length - 1; i >= 0; i--) {
      const b = breaths[i];
      b.life -= dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.vx *= 0.98;
      if (b.life <= 0) breaths.splice(i, 1);
    }

    if (G.paused) {
      audio.tickDrone();
      return;
    }

    if (G.mode === "play") {
      stepListen(dt);
      if (G.demoI < 0 && G.listenI < 0) {
        G.remain -= dt;
        if (G.remain <= 0) {
          G.remain = 0;
          loseLife("气尽 · 命 -1");
        }
      }
      syncHud(false);
    } else if (G.mode === "clear") {
      G.clearT -= dt;
      if (G.clearT <= 0) {
        if (G.stage + 1 >= STAGES.length) {
          G.mode = "win";
          showOverlay("win");
          audio.win();
          syncHud(true);
        } else {
          loadStage(G.stage + 1);
        }
      }
    } else if (G.mode === "title") {
      const wave = (Math.sin(G.t * 0.7) * 0.5 + 0.5) * 6;
      const n = Math.round(wave);
      for (let i = 0; i < HOLES; i++) sticky[i] = i < n;
      if ((G.clock * 2) % 3 < dt * 2) {
        G.membrane = 0.8;
        puffBreath(true);
      }
    }

    audio.tickDrone();
  }

  let acc = 0;
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    acc += dt;
    while (acc >= STEP) {
      update(STEP);
      acc -= STEP;
    }
    draw();
    requestAnimationFrame(frame);
  }

  function onKey(e, down) {
    if (e.repeat && down) return;
    const code = e.code;
    if (code === "KeyM" && down) {
      audio.ensure();
      audio.setMuted(!audio.muted);
      e.preventDefault();
      return;
    }
    if (code === "KeyR" && down) {
      audio.ensure();
      retryStage();
      e.preventDefault();
      return;
    }
    if (code === "KeyL" && down) {
      startListen();
      e.preventDefault();
      return;
    }
    if ((code === "KeyX" || code === "Digit0" || code === "Backspace") && down) {
      if (G.mode === "play" || G.mode === "title") {
        clearFingers();
        audio.tap();
        syncHud(true);
      }
      e.preventDefault();
      return;
    }
    if ((code === "Space" || code === "Enter") && down) {
      e.preventDefault();
      audio.ensure();
      if (G.mode === "title" || G.mode === "win" || G.mode === "lose") startRun();
      else blow();
      return;
    }
    const hi = KEY_HOLE[code];
    if (hi != null) {
      held[hi] = down;
      if (down) holePulse[hi] = 0.7;
      if (G.mode === "play" || G.mode === "title") syncHud(true);
      e.preventDefault();
    }
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (G.mode === "title" || G.mode === "win" || G.mode === "lose") return;
    audio.ensure();
    const p = canvasPos(e);
    G.hover = hitHole(p.x, p.y);
    if (hitBlow(p.x, p.y)) {
      blow();
      e.preventDefault();
      return;
    }
    const i = hitHole(p.x, p.y);
    if (i >= 0) {
      toggleHole(i);
      e.preventDefault();
    }
  });

  canvas.addEventListener("pointermove", (e) => {
    const p = canvasPos(e);
    const i = hitHole(p.x, p.y);
    G.hover = i;
    canvas.style.cursor = i >= 0 || hitBlow(p.x, p.y) ? "pointer" : "default";
  });

  canvas.addEventListener("pointerup", () => {});
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  window.addEventListener("keydown", (e) => onKey(e, true));
  window.addEventListener("keyup", (e) => onKey(e, false));

  ovBtn.addEventListener("click", () => {
    audio.ensure();
    ovBtn.blur();
    startRun();
  });
  btnRetry.addEventListener("click", () => {
    audio.ensure();
    retryStage();
  });
  btnMute.addEventListener("click", () => {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  btnListen.addEventListener("click", () => {
    audio.ensure();
    startListen();
  });

  document.addEventListener("visibilitychange", () => {
    G.paused = document.hidden;
    if (!audio.ctx) return;
    if (document.hidden) audio.ctx.suspend();
    else audio.ctx.resume();
  });

  window.addEventListener("blur", () => {
    for (let i = 0; i < HOLES; i++) held[i] = false;
  });
  window.addEventListener("resize", resize);

  makeMotes();
  G.spec = STAGES[0];
  resize();
  showOverlay("title");
  syncHud(true);
  requestAnimationFrame(frame);
})();
