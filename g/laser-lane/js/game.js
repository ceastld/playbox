(() => {
  "use strict";

  const WORLD_H = 360;
  const WORLD_LEN = 4080;
  const SPEED = 148;
  const SPEED_Y = 460;
  const PLAYER_R = 11;
  const WALL = 56;
  const SEAM = 38;
  const MID_Y = 180;
  const LIVES = 3;
  const EXIT_X = 3860;
  const EXIT_W = 46;
  const ARM = 340;
  const SCAN_T = 0.34;
  const IFRAME = 0.92;
  const LOCK = 0.28;
  const DIE_T = 0.68;
  const WIN_T = 0.82;
  const TAU = Math.PI * 2;
  const INNER_TOP = WALL;
  const INNER_BOT = WORLD_H - WALL;

  const SEGMENTS = [
    { name: "入口", sub: "ENTER", x: 0, hint: "贴进发亮的缝" },
    { name: "中廊", sub: "HALL", x: 960, hint: "上缝下缝交替" },
    { name: "深巷", sub: "DEEP", x: 1780, hint: "缝更短，光更快" },
    { name: "闸门", sub: "GATE", x: 2760, hint: "连卡两次，冲进闸门" }
  ];

  const ALCOVES = [
    { wall: "top", x: 380, w: 220 },
    { wall: "bot", x: 680, w: 220 },
    { wall: "top", x: 1000, w: 200 },
    { wall: "bot", x: 1280, w: 200 },
    { wall: "top", x: 1540, w: 200 },
    { wall: "top", x: 1820, w: 200 },
    { wall: "bot", x: 2040, w: 200 },
    { wall: "bot", x: 2300, w: 190 },
    { wall: "top", x: 2540, w: 190 },
    { wall: "bot", x: 2820, w: 190 },
    { wall: "top", x: 3000, w: 190 },
    { wall: "top", x: 3240, w: 180 },
    { wall: "bot", x: 3240, w: 180 },
    { wall: "top", x: 3500, w: 210 }
  ];

  const LASERS = [
    { x: 520, w: 20 },
    { x: 820, w: 20 },
    { x: 1140, w: 18 },
    { x: 1420, w: 18 },
    { x: 1680, w: 18 },
    { x: 1960, w: 16 },
    { x: 2180, w: 16 },
    { x: 2440, w: 16 },
    { x: 2680, w: 16 },
    { x: 2960, w: 15 },
    { x: 3140, w: 15 },
    { x: 3380, w: 16 },
    { x: 3640, w: 18 }
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
  const btnUp = document.getElementById("btn-up");
  const btnDown = document.getElementById("btn-down");
  const stageLabel = document.getElementById("stage-label");
  const distLabel = document.getElementById("dist-label");
  const pipsEl = document.getElementById("pips");
  const toastEl = document.getElementById("toast");
  const hintEl = document.getElementById("hint");

  const coarse = window.matchMedia("(pointer: coarse)").matches;

  let W = 1;
  let H = 1;
  let dpr = 1;
  let scale = 1;
  let camX = 0;

  const keys = { up: false, down: false };
  const pad = { up: false, down: false };
  const pointer = { down: false, id: null, y: MID_Y };

  const particles = [];
  const sparks = [];
  const trail = [];
  const motes = [];

  const G = {
    mode: "title",
    t: 0,
    clock: 0,
    lives: LIVES,
    tucked: 0,
    near: 0,
    shake: 0,
    flash: 0,
    cyanFlash: 0,
    lock: 0,
    iframe: 0,
    why: "",
    dieT: 0,
    toastT: 0,
    taught: false,
    taughtTuck: false,
    squash: 1,
    vy: 0,
    wasTuck: null,
    player: { x: 96, y: MID_Y, target: MID_Y },
    lasers: [],
    seg: 0
  };

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function mix(a, b, t) {
    return a + (b - a) * t;
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function ease(t) {
    t = clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
  }

  const audio = {
    ctx: null,
    master: null,
    drone: null,
    droneGain: null,
    muted: false,
    lastWarn: -9,
    ensure() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.24;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.24;
      btnMute.textContent = m ? "静" : "声";
      btnMute.classList.toggle("muted", m);
      btnMute.setAttribute("aria-label", m ? "取消静音" : "静音");
      try {
        localStorage.setItem("laser-lane-mute", m ? "1" : "0");
      } catch (e) { /* ignore */ }
    },
    beep(freq, dur, type, vol, slide) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
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
      o.stop(t + dur + 0.03);
    },
    noise(dur, vol) {
      if (!this.ctx || this.muted) return;
      const n = Math.floor(this.ctx.sampleRate * dur);
      const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = 1400;
      f.Q.value = 0.7;
      const g = this.ctx.createGain();
      g.gain.value = vol;
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start();
    },
    charge() {
      this.ensure();
      this.beep(180, 0.28, "sawtooth", 0.035, 520);
      this.beep(90, 0.32, "sine", 0.03, 220);
    },
    sweep() {
      this.ensure();
      this.noise(0.18, 0.07);
      this.beep(880, 0.16, "triangle", 0.05, 180);
    },
    tuck() {
      this.ensure();
      this.beep(620, 0.08, "triangle", 0.07, 240);
      this.beep(180, 0.1, "sine", 0.04, 90);
    },
    near() {
      this.ensure();
      this.beep(980, 0.09, "sine", 0.05, 1400);
    },
    hit() {
      this.ensure();
      this.noise(0.2, 0.09);
      this.beep(240, 0.42, "sawtooth", 0.08, 60);
    },
    win() {
      this.ensure();
      this.beep(440, 0.16, "triangle", 0.09, 880);
      this.beep(660, 0.28, "sine", 0.07, 1320);
      this.beep(880, 0.4, "sine", 0.05, 1760);
    },
    lose() {
      this.ensure();
      this.beep(200, 0.5, "sawtooth", 0.09, 50);
      this.beep(90, 0.7, "square", 0.05, 40);
    },
    start() {
      this.ensure();
      this.beep(220, 0.16, "sine", 0.07, 520);
    },
    tickDrone(nearHot) {
      if (!this.ctx || this.muted) return;
      if (!this.drone) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = "sine";
        o.frequency.value = 62;
        g.gain.value = 0.02;
        o.connect(g);
        g.connect(this.master);
        o.start();
        this.drone = o;
        this.droneGain = g;
      }
      const t = this.ctx.currentTime;
      const playing = G.mode === "play";
      this.drone.frequency.setTargetAtTime(nearHot ? 78 : 62, t, 0.12);
      this.droneGain.gain.setTargetAtTime(playing ? (nearHot ? 0.048 : 0.02) : 0.0001, t, 0.14);
    },
    stopDrone() {
      if (!this.droneGain || !this.ctx) return;
      this.droneGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.2);
    }
  };

  try {
    if (localStorage.getItem("laser-lane-mute") === "1") audio.setMuted(true);
  } catch (e) { /* ignore */ }

  function sx(x) {
    return (x - camX) * scale;
  }
  function sy(y) {
    return y * scale;
  }

  function alcoveAt(x, wall, padAmt) {
    const p = padAmt || 0;
    for (let i = 0; i < ALCOVES.length; i++) {
      const a = ALCOVES[i];
      if (a.wall !== wall) continue;
      if (x >= a.x + p && x <= a.x + a.w - p) return a;
    }
    return null;
  }

  function innerY(x, wall) {
    if (wall === "top") return alcoveAt(x, "top", 0) ? INNER_TOP - SEAM : INNER_TOP;
    return alcoveAt(x, "bot", 0) ? INNER_BOT + SEAM : INNER_BOT;
  }

  function yLimits(x) {
    const top = alcoveAt(x, "top", PLAYER_R * 0.6);
    const bot = alcoveAt(x, "bot", PLAYER_R * 0.6);
    return {
      lo: top ? INNER_TOP - SEAM + PLAYER_R + 2 : INNER_TOP + PLAYER_R + 1,
      hi: bot ? INNER_BOT + SEAM - PLAYER_R - 2 : INNER_BOT - PLAYER_R - 1
    };
  }

  function tuckedAt(x, y) {
    if (y < INNER_TOP - 3 && alcoveAt(x, "top", PLAYER_R * 0.45)) return "top";
    if (y > INNER_BOT + 3 && alcoveAt(x, "bot", PLAYER_R * 0.45)) return "bot";
    return null;
  }

  function segmentAt(x) {
    let i = 0;
    for (let s = 0; s < SEGMENTS.length; s++) {
      if (x >= SEGMENTS[s].x) i = s;
    }
    return i;
  }

  function makeMotes() {
    motes.length = 0;
    for (let i = 0; i < 78; i++) {
      motes.push({
        x: Math.random() * (WORLD_LEN + 700) - 180,
        y: Math.random() * WORLD_H,
        r: Math.random() * 1.5 + 0.25,
        a: Math.random() * 0.32 + 0.04,
        p: Math.random() * TAU,
        s: Math.random() * 10 + 3
      });
    }
  }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 110) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life,
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        mag: spec.mag || false
      });
    }
  }

  function spark(x, y, n, mag) {
    for (let i = 0; i < n; i++) {
      if (sparks.length > 70) sparks.shift();
      const a = rand(-0.4, TAU + 0.4);
      const sp = rand(40, 180);
      sparks.push({
        x: x,
        y: y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: rand(0.18, 0.48),
        mag: mag !== false
      });
    }
  }

  function toast(msg, warn) {
    toastEl.textContent = msg;
    toastEl.classList.toggle("warn", !!warn);
    toastEl.classList.remove("hidden");
    G.toastT = 2.2;
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
    scale = H / WORLD_H;
  }

  function resetRun() {
    G.t = 0;
    G.lives = LIVES;
    G.tucked = 0;
    G.near = 0;
    G.shake = 0;
    G.flash = 0;
    G.cyanFlash = 0;
    G.lock = LOCK;
    G.iframe = 0;
    G.why = "";
    G.dieT = 0;
    G.taught = false;
    G.taughtTuck = false;
    G.squash = 1;
    G.vy = 0;
    G.wasTuck = null;
    G.seg = 0;
    G.player.x = 96;
    G.player.y = MID_Y;
    G.player.target = MID_Y;
    particles.length = 0;
    sparks.length = 0;
    trail.length = 0;
    G.lasers = LASERS.map(function (L) {
      return {
        x: L.x,
        w: L.w,
        armed: false,
        scan: 0,
        hot: false,
        passed: false,
        scored: false,
        charged: false
      };
    });
    makeMotes();
    pointer.down = false;
    pointer.id = null;
    keys.up = false;
    keys.down = false;
    pad.up = false;
    pad.down = false;
    btnUp.classList.remove("held");
    btnDown.classList.remove("held");
    syncHud();
  }

  function showPanel(kind) {
    overlay.classList.remove("hidden");
    panel.classList.remove("win", "lose");
    if (kind === "title") {
      ovKicker.textContent = "LANES";
      ovTitle.textContent = "光巷";
      ovLead.innerHTML = "激光扫过整条巷道。贴进发亮的缝，才能活着过去。<br />开跑后不能停，卡进缝里等光过去。";
      ovOps.textContent = coarse
        ? "按住「上缝」「下缝」或拖屏幕贴壁 · M 静音"
        : "W / ↑ 贴上壁 · S / ↓ 贴下壁 · 拖屏幕 · M 静音";
      ovBtn.textContent = "进巷";
    } else if (kind === "win") {
      panel.classList.add("win");
      ovKicker.textContent = "CLEAR";
      ovTitle.textContent = "出巷";
      ovLead.textContent = "十三道光都卡过去了。闸门在你身后合上。";
      ovOps.textContent = "卡缝 " + G.tucked + " · 贴身 " + G.near;
      ovBtn.textContent = "再跑一趟";
    } else {
      panel.classList.add("lose");
      ovKicker.textContent = "SLICED";
      ovTitle.textContent = "切开";
      ovLead.textContent = G.why === "gate"
        ? "闸门前的最后一刀，没缝可卡。"
        : "巷道正中没有影子。激光把你从中间分开。";
      ovOps.textContent = "跑到 " + Math.max(0, G.player.x - 96 | 0) + " · 卡缝 " + G.tucked;
      ovBtn.textContent = "再进一趟";
    }
  }

  function startPlay() {
    audio.start();
    resetRun();
    G.mode = "play";
    overlay.classList.add("hidden");
    hintEl.textContent = coarse
      ? "按住上缝 / 下缝 · 卡进发亮的缺口"
      : "贴壁 · 卡进发亮的缝 · M 静音";
    toast("缝会发亮 · 激光扫过来就卡进去");
  }

  function endGame(win, why) {
    if (G.mode !== "play") return;
    G.why = why || "";
    if (win) {
      G.mode = "exiting";
      G.dieT = WIN_T;
      toastEl.classList.add("hidden");
      G.toastT = 0;
      audio.win();
      emit(36, {
        x: EXIT_X,
        y: MID_Y,
        j: 22,
        vx0: -80,
        vx1: 40,
        vy0: -90,
        vy1: 90,
        life: 0.95,
        r0: 1.4,
        r1: 4.4,
        mag: false
      });
    } else {
      G.mode = "dying";
      G.dieT = DIE_T;
      G.flash = 1;
      G.shake = 12;
      toastEl.classList.add("hidden");
      G.toastT = 0;
      audio.lose();
      emit(28, {
        x: G.player.x,
        y: G.player.y,
        j: 8,
        vx0: -110,
        vx1: 110,
        vy0: -90,
        vy1: 90,
        life: 0.72,
        r0: 1.3,
        r1: 4.2,
        mag: true
      });
      spark(G.player.x, G.player.y, 14, true);
    }
    audio.stopDrone();
  }

  function hurt(laser) {
    if (G.iframe > 0 || G.mode !== "play") return;
    G.lives -= 1;
    G.flash = 0.85;
    G.shake = 9;
    audio.hit();
    emit(18, {
      x: G.player.x,
      y: G.player.y,
      j: 6,
      vx0: -80,
      vx1: 80,
      vy0: -70,
      vy1: 70,
      life: 0.45,
      r0: 1.2,
      r1: 3.4,
      mag: true
    });
    spark(G.player.x, G.player.y, 10, true);
    if (G.lives <= 0) {
      endGame(false, laser.x > 3300 ? "gate" : "slice");
      return;
    }
    G.iframe = IFRAME;
    G.player.x = laser.x + laser.w + PLAYER_R + 10;
    laser.passed = true;
    laser.hot = false;
    toast("相位被削 · 还剩 " + G.lives, true);
    syncHud();
  }

  function pointerWorldY(e) {
    const rect = canvas.getBoundingClientRect();
    return clamp(((e.clientY - rect.top) / rect.height) * WORLD_H, 0, WORLD_H);
  }

  function seekTarget() {
    if (pointer.down) return pointer.y;
    const up = keys.up || pad.up;
    const down = keys.down || pad.down;
    if (up && down) return MID_Y;
    if (up) return -40;
    if (down) return WORLD_H + 40;
    return MID_Y;
  }

  function updateDemo(dt) {
    G.clock += dt;
    G.player.x = 488;
    const lim = yLimits(G.player.x);
    const cyc = (G.clock * 0.52) % 2.2;
    let u = 0;
    if (cyc < 0.28) u = 0;
    else if (cyc < 0.5) u = ease((cyc - 0.28) / 0.22);
    else if (cyc < 1.55) u = 1;
    else if (cyc < 1.85) u = ease(1 - (cyc - 1.55) / 0.3);
    const prevY = G.player.y;
    G.player.y = mix(MID_Y, lim.lo, u);
    G.player.target = G.player.y;
    G.vy = (G.player.y - prevY) / Math.max(dt, 0.0001);
    camX = 230;
    const L = G.lasers[0];
    if (L) {
      L.armed = true;
      L.charged = true;
      if (cyc < 0.22) {
        L.hot = false;
        L.scan = cyc / 0.22;
      } else if (cyc < 1.6) {
        L.hot = true;
        L.scan = 1;
      } else {
        L.hot = false;
        L.scan = 0;
      }
      if (L.hot && Math.random() < dt * 10) {
        spark(L.x + L.w * 0.5, mix(INNER_TOP + 12, INNER_BOT - 12, Math.random()), 1, true);
      }
    }
    G.squash = lerp(G.squash, u > 0.7 ? 0.72 : 1, 1 - Math.pow(0.001, dt));
    updateFx(dt);
  }

  function updatePlay(dt) {
    const p = G.player;
    const playing = G.mode === "play";

    if (playing && G.lock <= 0) {
      const lim = yLimits(p.x);
      p.target = clamp(seekTarget(), lim.lo, lim.hi);
      const prevY = p.y;
      const seek = (p.target - p.y) * Math.min(1, dt * 14);
      const cap = SPEED_Y * dt;
      p.y += clamp(seek, -cap, cap);
      p.y = clamp(p.y, lim.lo, lim.hi);
      G.vy = (p.y - prevY) / Math.max(dt, 0.0001);

      let spd = SPEED;
      const tuck = tuckedAt(p.x, p.y);
      if (tuck) spd *= 0.92;
      if (p.x > EXIT_X - 220) spd *= mix(1, 0.4, clamp((p.x - (EXIT_X - 220)) / 220, 0, 1));
      p.x += spd * dt;
      if (p.x > EXIT_X + 8) p.x = EXIT_X + 8;

      const tuckNow = tuckedAt(p.x, p.y);
      G.squash = lerp(G.squash, tuckNow ? 0.72 : 1, 1 - Math.pow(0.001, dt));

      if (tuckNow && !G.wasTuck) {
        audio.tuck();
        emit(tuckNow && !G.taughtTuck ? 8 : 4, {
          x: p.x,
          y: p.y,
          j: 4,
          vx0: -20,
          vx1: 40,
          vy0: tuckNow === "top" ? 10 : -40,
          vy1: tuckNow === "top" ? 50 : -10,
          life: 0.3,
          r0: 0.9,
          r1: 2.3,
          mag: false
        });
        if (!G.taughtTuck) {
          G.taughtTuck = true;
          G.cyanFlash = 0.32;
          toast("卡进缝里了");
        }
      }
      G.wasTuck = tuckNow;

      const si = segmentAt(p.x);
      if (si !== G.seg) {
        G.seg = si;
        toast(SEGMENTS[si].name + " · " + SEGMENTS[si].hint);
      }

      if (p.x >= EXIT_X - 6) {
        endGame(true, "exit");
        return;
      }
    } else if (G.mode === "exiting") {
      p.x = lerp(p.x, EXIT_X + 10, dt * 3.2);
      p.y = lerp(p.y, MID_Y, dt * 3.4);
      G.vy *= 0.88;
    } else if (G.mode === "dying") {
      p.x += dt * 18;
      G.vy = 0;
    }

    if (playing) {
      for (let i = 0; i < G.lasers.length; i++) {
        const L = G.lasers[i];
        if (L.passed) continue;
        if (!L.armed && p.x > L.x - ARM) {
          L.armed = true;
          L.scan = 0;
          if (!L.charged) {
            L.charged = true;
            audio.charge();
            if (!G.taught) {
              G.taught = true;
              toast("光在充电 · 先贴进缝");
            }
          }
        }
        if (L.armed && !L.hot) {
          L.scan += dt / SCAN_T;
          if (L.scan >= 1) {
            L.scan = 1;
            L.hot = true;
            audio.sweep();
            spark(L.x + L.w * 0.5, INNER_TOP + 8, 6, true);
            spark(L.x + L.w * 0.5, INNER_BOT - 8, 6, true);
          }
        }
        if (p.x - PLAYER_R > L.x + L.w + 4) {
          L.passed = true;
          L.hot = false;
          if (L.scored) G.tucked += 1;
        }
      }

      const pr = PLAYER_R - 1;
      for (let i = 0; i < G.lasers.length; i++) {
        const L = G.lasers[i];
        if (!L.hot || L.passed) continue;
        const overlapX = p.x + pr > L.x && p.x - pr < L.x + L.w;
        if (!overlapX) continue;
        const hide = tuckedAt(p.x, p.y);
        if (hide) {
          if (!L.scored) {
            L.scored = true;
            const dx = Math.min(Math.abs(p.x - L.x), Math.abs(p.x - (L.x + L.w)));
            if (dx < PLAYER_R + 10) {
              G.near += 1;
              audio.near();
              G.cyanFlash = 0.22;
            }
            emit(10, {
              x: p.x + 6,
              y: p.y,
              j: 5,
              vx0: 10,
              vx1: 70,
              vy0: hide === "top" ? 8 : -50,
              vy1: hide === "top" ? 50 : -8,
              life: 0.4,
              r0: 1,
              r1: 2.6,
              mag: false
            });
          }
        } else {
          hurt(L);
          if (G.mode !== "play") return;
        }
      }
    }

    if (playing && Math.random() < dt * 14) {
      trail.push({ x: p.x - 6, y: p.y, a: 1, r: 4.5 });
      if (trail.length > 18) trail.shift();
    }

    camX = p.x - (W * 0.28) / scale;
    const minCam = -36;
    const maxCam = WORLD_LEN - W / scale + 60;
    camX = clamp(camX, minCam, Math.max(minCam, maxCam));
    updateFx(dt);
    syncHud();
  }

  function updateFx(dt) {
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 22);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.5);
    if (G.cyanFlash > 0) G.cyanFlash = Math.max(0, G.cyanFlash - dt * 3.1);
    if (G.lock > 0) G.lock -= dt;
    if (G.iframe > 0) G.iframe -= dt;
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) toastEl.classList.add("hidden");
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.life -= dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vy += 22 * dt;
      if (q.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const q = sparks[i];
      q.life -= dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vx *= 0.92;
      q.vy *= 0.92;
      if (q.life <= 0) sparks.splice(i, 1);
    }
    for (let i = trail.length - 1; i >= 0; i--) {
      trail[i].a -= dt * 2.8;
      if (trail[i].a <= 0) trail.splice(i, 1);
    }
    if (G.mode === "play") {
      for (let i = 0; i < G.lasers.length; i++) {
        const L = G.lasers[i];
        if (!L.hot && !(L.armed && L.scan > 0.4)) continue;
        if (L.x < camX - 20 || L.x > camX + W / scale + 20) continue;
        if (Math.random() < dt * 18) {
          spark(L.x + rand(0, L.w), rand(INNER_TOP + 10, INNER_BOT - 10), 1, true);
        }
      }
    }
  }

  function syncHud() {
    if (G.mode === "title") {
      stageLabel.textContent = "激光扫巷";
      distLabel.textContent = "距闸 —";
    } else {
      const s = SEGMENTS[segmentAt(G.player.x)];
      stageLabel.textContent = s.name + " · " + s.sub;
      const d = Math.max(0, (EXIT_X - G.player.x) | 0);
      distLabel.textContent = G.mode === "exiting" || G.mode === "win" ? "出巷" : "距闸 " + d;
    }
    pipsEl.innerHTML = "";
    const max = G.mode === "title" ? 0 : LIVES;
    const lives = G.mode === "title" ? 0 : G.lives;
    for (let i = 0; i < max; i++) {
      const pip = document.createElement("span");
      pip.className = "pip";
      if (i < lives) {
        pip.classList.add("on");
        if (lives <= 1 && G.mode === "play") pip.classList.add("warn");
      }
      pipsEl.appendChild(pip);
    }
  }

  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#120818");
    g.addColorStop(0.45, "#090510");
    g.addColorStop(1, "#04020c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const pulse = 0.5 + Math.sin(G.clock * 0.7) * 0.5;
    const mag = ctx.createRadialGradient(W * 0.18, H * 0.12, 10, W * 0.18, H * 0.12, H * 0.55);
    mag.addColorStop(0, "rgba(255, 61, 184," + (0.07 + pulse * 0.04) + ")");
    mag.addColorStop(1, "rgba(255, 61, 184, 0)");
    ctx.fillStyle = mag;
    ctx.fillRect(0, 0, W, H);
    const cyn = ctx.createRadialGradient(W * 0.82, H * 0.78, 10, W * 0.82, H * 0.78, H * 0.5);
    cyn.addColorStop(0, "rgba(0, 240, 255, 0.06)");
    cyn.addColorStop(1, "rgba(0, 240, 255, 0)");
    ctx.fillStyle = cyn;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const x = sx(m.x + Math.sin(G.clock * 0.35 + m.p) * m.s);
      const y = sy(m.y);
      if (x < -6 || x > W + 6) continue;
      ctx.fillStyle = "rgba(190, 220, 255," + m.a + ")";
      ctx.beginPath();
      ctx.arc(x, y, m.r, 0, TAU);
      ctx.fill();
    }
  }

  function drawFloor() {
    const y0 = sy(INNER_TOP);
    const y1 = sy(INNER_BOT);
    const fg = ctx.createLinearGradient(0, y0, 0, y1);
    fg.addColorStop(0, "rgba(18, 8, 28, 0.15)");
    fg.addColorStop(0.5, "rgba(8, 10, 24, 0.55)");
    fg.addColorStop(1, "rgba(10, 8, 22, 0.15)");
    ctx.fillStyle = fg;
    ctx.fillRect(0, y0, W, y1 - y0);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, y0, W, y1 - y0);
    ctx.clip();
    ctx.strokeStyle = "rgba(0, 240, 255, 0.07)";
    ctx.lineWidth = 1;
    const x0 = camX - 20;
    const x1 = camX + W / scale + 40;
    const step = 56;
    const start = Math.floor(x0 / step) * step;
    for (let x = start; x < x1; x += step) {
      const px = sx(x);
      ctx.beginPath();
      ctx.moveTo(px, y0);
      ctx.lineTo(px + (MID_Y - INNER_TOP) * 0.04 * scale, sy(MID_Y));
      ctx.lineTo(px, y1);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(255, 61, 184, 0.08)";
    ctx.beginPath();
    ctx.moveTo(0, sy(MID_Y));
    ctx.lineTo(W, sy(MID_Y));
    ctx.stroke();
    ctx.setLineDash([6, 10]);
    ctx.strokeStyle = "rgba(0, 240, 255, 0.12)";
    ctx.beginPath();
    ctx.moveTo(0, sy(MID_Y - 44));
    ctx.lineTo(W, sy(MID_Y - 44));
    ctx.moveTo(0, sy(MID_Y + 44));
    ctx.lineTo(W, sy(MID_Y + 44));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawDecor() {
    const x0 = camX - 40;
    const x1 = camX + W / scale + 40;
    const step = 88;
    const start = Math.floor(x0 / step) * step;
    for (let x = start; x < x1; x += step) {
      const px = sx(x);
      const top = sy(innerY(x, "top"));
      const bot = sy(innerY(x, "bot"));
      ctx.strokeStyle = "rgba(255, 61, 184, 0.12)";
      ctx.lineWidth = 2.2 * scale;
      ctx.beginPath();
      ctx.moveTo(px, top);
      ctx.lineTo(px, bot);
      ctx.stroke();
      if (((x / step) | 0) % 3 === 0) {
        const wy = sy(MID_Y - 38);
        const ww = 22 * scale;
        const wh = 28 * scale;
        const wx = px + 8 * scale;
        ctx.fillStyle = "rgba(0, 240, 255, 0.04)";
        ctx.fillRect(wx, wy, ww, wh);
        ctx.strokeStyle = "rgba(0, 240, 255, 0.18)";
        ctx.lineWidth = 1;
        ctx.strokeRect(wx, wy, ww, wh);
        ctx.beginPath();
        ctx.moveTo(wx, wy + wh * 0.5);
        ctx.lineTo(wx + ww, wy + wh * 0.5);
        ctx.moveTo(wx + ww * 0.5, wy);
        ctx.lineTo(wx + ww * 0.5, wy + wh);
        ctx.stroke();
      }
    }

    ctx.font = "600 " + Math.max(10, 11 * scale) + "px Segoe UI, PingFang SC, sans-serif";
    ctx.textAlign = "left";
    for (let i = 0; i < SEGMENTS.length; i++) {
      const s = SEGMENTS[i];
      const x = sx(s.x + 24);
      if (x < -80 || x > W + 20) continue;
      ctx.fillStyle = "rgba(0, 240, 255, 0.55)";
      ctx.fillText(s.name + "  " + s.sub, x, sy(INNER_TOP + 18));
    }
  }

  function walkInner(wall, x0, x1, step) {
    const pts = [];
    for (let x = x0; x <= x1 + step; x += step) {
      pts.push({ x: x, y: innerY(x, wall) });
    }
    return pts;
  }

  function drawWalls() {
    const x0 = camX - 30;
    const x1 = camX + W / scale + 30;
    const step = 8;
    const top = walkInner("top", x0, x1, step);
    const bot = walkInner("bot", x0, x1, step);

    ctx.beginPath();
    ctx.moveTo(sx(top[0].x), 0);
    ctx.lineTo(sx(top[top.length - 1].x), 0);
    for (let i = top.length - 1; i >= 0; i--) ctx.lineTo(sx(top[i].x), sy(top[i].y));
    ctx.closePath();
    const tg = ctx.createLinearGradient(0, 0, 0, sy(INNER_TOP + 4));
    tg.addColorStop(0, "#1a0a22");
    tg.addColorStop(1, "#2c1233");
    ctx.fillStyle = tg;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(sx(bot[0].x), H);
    ctx.lineTo(sx(bot[bot.length - 1].x), H);
    for (let i = bot.length - 1; i >= 0; i--) ctx.lineTo(sx(bot[i].x), sy(bot[i].y));
    ctx.closePath();
    const bg = ctx.createLinearGradient(0, sy(INNER_BOT - 4), 0, H);
    bg.addColorStop(0, "#1c102c");
    bg.addColorStop(1, "#0a0614");
    ctx.fillStyle = bg;
    ctx.fill();

    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(255, 61, 184, 0.55)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let i = 0; i < top.length; i++) {
      if (i === 0) ctx.moveTo(sx(top[i].x), sy(top[i].y));
      else ctx.lineTo(sx(top[i].x), sy(top[i].y));
    }
    ctx.stroke();
    ctx.strokeStyle = "rgba(0, 240, 255, 0.42)";
    ctx.beginPath();
    for (let i = 0; i < bot.length; i++) {
      if (i === 0) ctx.moveTo(sx(bot[i].x), sy(bot[i].y));
      else ctx.lineTo(sx(bot[i].x), sy(bot[i].y));
    }
    ctx.stroke();

    drawAlcoves();
  }

  function drawAlcoves() {
    const view0 = camX - 20;
    const view1 = camX + W / scale + 20;
    for (let i = 0; i < ALCOVES.length; i++) {
      const a = ALCOVES[i];
      if (a.x + a.w < view0 || a.x > view1) continue;
      const x = sx(a.x);
      const w = a.w * scale;
      const nearby = laserNearAlcove(a);
      const pulse = 0.45 + Math.sin(G.clock * 6 + i) * 0.25;
      const glow = nearby ? 0.55 + pulse * 0.4 : 0.22 + pulse * 0.12;
      if (a.wall === "top") {
        const y = sy(INNER_TOP - SEAM);
        const h = SEAM * scale;
        const rg = ctx.createLinearGradient(x, y, x, y + h);
        rg.addColorStop(0, "rgba(4, 2, 12, 0.95)");
        rg.addColorStop(1, "rgba(0, 240, 255," + (0.08 + glow * 0.12) + ")");
        ctx.fillStyle = rg;
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = "rgba(0, 240, 255," + glow + ")";
        ctx.lineWidth = nearby ? 2.2 : 1.3;
        ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
        ctx.fillStyle = "rgba(0, 240, 255," + (0.12 + glow * 0.2) + ")";
        ctx.fillRect(x + 4, y + 3, w - 8, 3);
      } else {
        const y = sy(INNER_BOT);
        const h = SEAM * scale;
        const rg = ctx.createLinearGradient(x, y + h, x, y);
        rg.addColorStop(0, "rgba(4, 2, 12, 0.95)");
        rg.addColorStop(1, "rgba(0, 240, 255," + (0.08 + glow * 0.12) + ")");
        ctx.fillStyle = rg;
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = "rgba(0, 240, 255," + glow + ")";
        ctx.lineWidth = nearby ? 2.2 : 1.3;
        ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
        ctx.fillStyle = "rgba(0, 240, 255," + (0.12 + glow * 0.2) + ")";
        ctx.fillRect(x + 4, y + h - 6, w - 8, 3);
      }
    }
  }

  function laserNearAlcove(a) {
    for (let i = 0; i < G.lasers.length; i++) {
      const L = G.lasers[i];
      if (L.passed) continue;
      if (L.x + L.w < a.x - 8 || L.x > a.x + a.w + 8) continue;
      if (L.armed || L.hot) return true;
      if (G.player.x > L.x - ARM - 40) return true;
    }
    return false;
  }

  function drawLasers() {
    const list = G.lasers;
    for (let i = 0; i < list.length; i++) {
      const L = list[i];
      const x = sx(L.x);
      const w = Math.max(2, L.w * scale);
      if (x + w < -40 || x > W + 40) continue;
      const y0 = sy(INNER_TOP);
      const y1 = sy(INNER_BOT);
      const h = y1 - y0;

      ctx.save();
      ctx.beginPath();
      ctx.rect(x - 8, y0, w + 16, h);
      ctx.clip();

      const node = function (ny) {
        const rg = ctx.createRadialGradient(x + w * 0.5, ny, 1, x + w * 0.5, ny, 16);
        rg.addColorStop(0, "rgba(255, 80, 180, 0.85)");
        rg.addColorStop(1, "rgba(255, 61, 184, 0)");
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(x + w * 0.5, ny, 16, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "#ff9ad4";
        ctx.beginPath();
        ctx.arc(x + w * 0.5, ny, 3.2, 0, TAU);
        ctx.fill();
      };
      node(y0);
      node(y1);

      if (L.armed && !L.hot) {
        const k = ease(L.scan);
        ctx.strokeStyle = "rgba(255, 61, 184," + (0.25 + k * 0.5) + ")";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(x + w * 0.5, y0);
        ctx.lineTo(x + w * 0.5, y0 + h * k);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(255, 220, 240, 0.9)";
        ctx.beginPath();
        ctx.arc(x + w * 0.5, y0 + h * k, 3.4, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "rgba(255, 61, 184," + (0.08 + k * 0.1) + ")";
        ctx.fillRect(x, y0, w, h * k);
      }

      if (L.hot) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        const bloom = ctx.createLinearGradient(x - 18, 0, x + w + 18, 0);
        bloom.addColorStop(0, "rgba(255, 61, 184, 0)");
        bloom.addColorStop(0.45, "rgba(255, 61, 184, 0.22)");
        bloom.addColorStop(0.5, "rgba(255, 210, 240, 0.4)");
        bloom.addColorStop(0.55, "rgba(255, 61, 184, 0.22)");
        bloom.addColorStop(1, "rgba(255, 61, 184, 0)");
        ctx.fillStyle = bloom;
        ctx.fillRect(x - 22, y0, w + 44, h);
        ctx.fillStyle = "rgba(255, 61, 184, 0.55)";
        ctx.fillRect(x, y0, w, h);
        ctx.fillStyle = "rgba(255, 255, 255, 0.82)";
        ctx.fillRect(x + w * 0.32, y0, Math.max(1.5, w * 0.28), h);
        const scanY = y0 + ((G.clock * 140) % h);
        ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
        ctx.fillRect(x - 4, scanY, w + 8, 6);
        ctx.restore();
      } else if (!L.armed && !L.passed) {
        ctx.strokeStyle = "rgba(255, 61, 184, 0.18)";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 8]);
        ctx.beginPath();
        ctx.moveTo(x + w * 0.5, y0);
        ctx.lineTo(x + w * 0.5, y1);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.restore();
    }
  }

  function drawExit() {
    const x = sx(EXIT_X);
    if (x < -80 || x > W + 80) return;
    const y0 = sy(INNER_TOP + 8);
    const y1 = sy(INNER_BOT - 8);
    const w = EXIT_W * scale;
    const pulse = 0.55 + Math.sin(G.clock * 3.4) * 0.2;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const rg = ctx.createLinearGradient(x - 30, 0, x + w + 40, 0);
    rg.addColorStop(0, "rgba(0, 240, 255, 0)");
    rg.addColorStop(0.5, "rgba(0, 240, 255," + (0.16 * pulse) + ")");
    rg.addColorStop(1, "rgba(0, 240, 255, 0)");
    ctx.fillStyle = rg;
    ctx.fillRect(x - 40, y0, w + 80, y1 - y0);
    ctx.restore();
    ctx.strokeStyle = "rgba(0, 240, 255, 0.9)";
    ctx.lineWidth = 2.4;
    ctx.strokeRect(x, y0, w, y1 - y0);
    ctx.strokeStyle = "rgba(255, 227, 107, 0.7)";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x + 7, y0 + 10, w - 14, y1 - y0 - 20);
    ctx.fillStyle = "rgba(0, 240, 255, 0.12)";
    ctx.fillRect(x + 4, y0 + 4, w - 8, y1 - y0 - 8);
    ctx.fillStyle = "rgba(232, 250, 255, 0.8)";
    ctx.font = "600 " + Math.max(10, 11 * scale) + "px Segoe UI, PingFang SC, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("闸门", x + w * 0.5, y0 - 8);
  }

  function drawFx() {
    for (let i = 0; i < trail.length; i++) {
      const q = trail[i];
      ctx.fillStyle = "rgba(0, 240, 255," + (q.a * 0.28) + ")";
      ctx.beginPath();
      ctx.arc(sx(q.x), sy(q.y), q.r * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < particles.length; i++) {
      const q = particles[i];
      const a = clamp(q.life / q.max, 0, 1);
      ctx.fillStyle = q.mag
        ? "rgba(255, 61, 184," + a + ")"
        : "rgba(0, 240, 255," + a + ")";
      ctx.beginPath();
      ctx.arc(sx(q.x), sy(q.y), q.r, 0, TAU);
      ctx.fill();
    }
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < sparks.length; i++) {
      const q = sparks[i];
      ctx.strokeStyle = q.mag
        ? "rgba(255, 160, 220," + clamp(q.life * 2.2, 0, 0.9) + ")"
        : "rgba(160, 250, 255," + clamp(q.life * 2.2, 0, 0.9) + ")";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(sx(q.x), sy(q.y));
      ctx.lineTo(sx(q.x - q.vx * 0.04), sy(q.y - q.vy * 0.04));
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPlayer() {
    const p = G.player;
    const x = sx(p.x);
    const y = sy(p.y);
    const s = scale;
    const hide = tuckedAt(p.x, p.y);
    const blink = G.iframe > 0 && ((G.iframe * 16) | 0) % 2 === 0;
    if (blink && G.mode === "play") ctx.globalAlpha = 0.35;

    ctx.save();
    ctx.translate(x, y);
    const tilt = clamp(G.vy * 0.0014, -0.42, 0.42);
    ctx.rotate(tilt);
    const sq = G.squash;
    if (hide === "top") ctx.scale(1.12, sq);
    else if (hide === "bot") ctx.scale(1.12, sq);
    else ctx.scale(1 + Math.min(0.12, Math.abs(G.vy) * 0.00025), 1);

    ctx.globalCompositeOperation = "lighter";
    const halo = ctx.createRadialGradient(0, 0, 2 * s, 0, 0, 22 * s);
    halo.addColorStop(0, hide ? "rgba(0, 240, 255, 0.28)" : "rgba(255, 61, 184, 0.16)");
    halo.addColorStop(1, "rgba(0, 240, 255, 0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, 22 * s, 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    const body = ctx.createLinearGradient(0, -12 * s, 0, 12 * s);
    body.addColorStop(0, "#e7fbff");
    body.addColorStop(0.45, "#1ad4e4");
    body.addColorStop(1, "#0a5a78");
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(13 * s, 0);
    ctx.lineTo(0, -10 * s);
    ctx.lineTo(-11 * s, 0);
    ctx.lineTo(0, 10 * s);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "#ff3db8";
    ctx.beginPath();
    ctx.moveTo(4 * s, -9 * s);
    ctx.lineTo(9 * s, -15 * s);
    ctx.lineTo(11 * s, -8 * s);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(236, 255, 255, 0.95)";
    ctx.beginPath();
    ctx.ellipse(4.5 * s, -1.2 * s, 3.4 * s, 2.5 * s, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 61, 184, 0.75)";
    ctx.lineWidth = 0.9;
    ctx.stroke();

    if (G.mode === "dying") {
      ctx.strokeStyle = "rgba(255, 61, 184, 0.95)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-8 * s, -8 * s);
      ctx.lineTo(10 * s, 8 * s);
      ctx.moveTo(8 * s, -7 * s);
      ctx.lineTo(-6 * s, 8 * s);
      ctx.stroke();
    }

    ctx.restore();
    ctx.globalAlpha = 1;

    if (hide) {
      ctx.strokeStyle = "rgba(0, 240, 255, 0.7)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      const edge = hide === "top" ? INNER_TOP - SEAM + 2 : INNER_BOT + SEAM - 2;
      ctx.arc(x, sy(edge), 5 * s, 0, TAU);
      ctx.stroke();
    }
  }

  function drawVignette() {
    const vg = ctx.createRadialGradient(W * 0.42, H * 0.5, H * 0.18, W * 0.42, H * 0.5, H * 0.82);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(3,1,10,0.48)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
    if (G.flash > 0) {
      ctx.fillStyle = "rgba(255, 61, 184," + (G.flash * 0.34) + ")";
      ctx.fillRect(0, 0, W, H);
    }
    if (G.cyanFlash > 0) {
      ctx.fillStyle = "rgba(0, 240, 255," + (G.cyanFlash * 0.16) + ")";
      ctx.fillRect(0, 0, W, H);
    }
    if (G.mode === "play" && G.lives <= 1) {
      const a = 0.06 + Math.sin(G.t * 8) * 0.04;
      ctx.fillStyle = "rgba(255, 61, 184," + a + ")";
      ctx.fillRect(0, 0, W, H);
    }
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (G.shake > 0) {
      ctx.translate((Math.random() - 0.5) * G.shake, (Math.random() - 0.5) * G.shake);
    }
    drawSky();
    drawFloor();
    drawDecor();
    drawExit();
    drawLasers();
    drawWalls();
    drawFx();
    drawPlayer();
    drawVignette();
  }

  let last = 0;
  let hidden = false;

  function frame(now) {
    const t = now * 0.001;
    let dt = t - last;
    last = t;
    if (dt > 0.05) dt = 0.05;
    if (dt < 0) dt = 0;
    if (hidden) dt = 0;
    G.clock += dt;
    if (G.mode === "play") G.t += dt;

    if (G.mode === "title") updateDemo(dt);
    else updatePlay(dt);

    if (G.mode === "play") {
      let nearHot = false;
      for (let i = 0; i < G.lasers.length; i++) {
        const L = G.lasers[i];
        if ((L.hot || L.armed) && !L.passed && Math.abs(L.x - G.player.x) < 220) {
          nearHot = true;
          break;
        }
      }
      audio.tickDrone(nearHot);
    }

    if (G.mode === "dying" || G.mode === "exiting") {
      G.dieT -= dt;
      if (G.dieT <= 0) {
        const win = G.mode === "exiting";
        G.mode = win ? "win" : "lose";
        showPanel(win ? "win" : "lose");
      }
    }

    draw();
    requestAnimationFrame(frame);
  }

  function onKey(e, down) {
    const k = e.key;
    if (k === "ArrowUp" || k === "w" || k === "W") {
      keys.up = down;
      e.preventDefault();
    } else if (k === "ArrowDown" || k === "s" || k === "S") {
      keys.down = down;
      e.preventDefault();
    }
    if (!down) return;
    if (k === "m" || k === "M") {
      audio.ensure();
      audio.setMuted(!audio.muted);
    }
    if (k === "r" || k === "R") {
      audio.ensure();
      startPlay();
    }
    if (k === " " || k === "Enter") {
      e.preventDefault();
      audio.ensure();
      if (G.mode === "title" || G.mode === "win" || G.mode === "lose") startPlay();
    }
  }

  function bindPad(el, dir) {
    const set = function (v) {
      pad[dir] = v;
      el.classList.toggle("held", v);
    };
    el.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      e.stopPropagation();
      audio.ensure();
      set(true);
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    });
    const up = function (e) {
      e.preventDefault();
      set(false);
    };
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("pointerleave", function () { set(false); });
  }
  bindPad(btnUp, "up");
  bindPad(btnDown, "down");

  canvas.addEventListener("pointerdown", function (e) {
    if (e.button != null && e.button !== 0) return;
    audio.ensure();
    if (G.mode === "title" || G.mode === "win" || G.mode === "lose") return;
    pointer.down = true;
    pointer.id = e.pointerId;
    pointer.y = pointerWorldY(e);
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    e.preventDefault();
  });
  canvas.addEventListener("pointermove", function (e) {
    if (!pointer.down || (pointer.id != null && e.pointerId !== pointer.id)) return;
    pointer.y = pointerWorldY(e);
    e.preventDefault();
  });
  function pointerUp(e) {
    if (pointer.id != null && e.pointerId !== pointer.id) return;
    pointer.down = false;
    pointer.id = null;
  }
  canvas.addEventListener("pointerup", pointerUp);
  canvas.addEventListener("pointercancel", pointerUp);
  canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });

  ovBtn.addEventListener("click", function () {
    audio.ensure();
    startPlay();
  });
  btnRetry.addEventListener("click", function () {
    audio.ensure();
    startPlay();
  });
  btnMute.addEventListener("click", function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });

  window.addEventListener("keydown", function (e) { onKey(e, true); });
  window.addEventListener("keyup", function (e) { onKey(e, false); });
  window.addEventListener("blur", function () {
    keys.up = false;
    keys.down = false;
    pad.up = false;
    pad.down = false;
    pointer.down = false;
    btnUp.classList.remove("held");
    btnDown.classList.remove("held");
  });
  document.addEventListener("visibilitychange", function () {
    hidden = document.hidden;
    if (hidden) {
      keys.up = false;
      keys.down = false;
      pointer.down = false;
    }
  });
  window.addEventListener("resize", resize);
  if (window.ResizeObserver) {
    new ResizeObserver(resize).observe(canvas.parentElement);
  }

  resetRun();
  G.mode = "title";
  showPanel("title");
  resize();
  syncHud();
  requestAnimationFrame(function (t) {
    last = t * 0.001;
    requestAnimationFrame(frame);
  });
})();
