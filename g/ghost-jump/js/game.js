(() => {
  "use strict";

  const VW = 960;
  const VH = 540;
  const PW = 16;
  const PH = 26;
  const MOVE = 305;
  const ACCEL_G = 2600;
  const ACCEL_A = 1550;
  const FRICTION = 2400;
  const GRAVITY = 2450;
  const MAX_FALL = 1050;
  const JUMP_V = 730;
  const COYOTE = 0.09;
  const BUFFER = 0.13;
  const EW = 72;
  const EH = 13;
  const SAMPLE_MIN = 28;
  const KILL_Y = 528;
  const EXIT_R = 32;
  const INVULN = 0.7;
  const DIE_T = 0.58;

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function jumpHeight() {
    return (JUMP_V * JUMP_V) / (2 * GRAVITY);
  }

  const STAGES = [
    {
      name: "初痕",
      sub: "TRACE",
      lives: 5,
      hint: "先跳出去，摔一次",
      spawn: { x: 78, y: 445 },
      exit: { x: 455, y: 318 },
      base: { x: 22, y: 458, w: 108, h: 16 },
      walls: [],
      spikes: []
    },
    {
      name: "叠台",
      sub: "STACK",
      lives: 7,
      hint: "踩着脚印，再往上跳",
      spawn: { x: 78, y: 445 },
      exit: { x: 740, y: 228 },
      base: { x: 22, y: 458, w: 108, h: 16 },
      walls: [
        { x: 430, y: 318, w: 24, h: 162 }
      ],
      spikes: []
    },
    {
      name: "刺谷",
      sub: "THORN",
      lives: 7,
      hint: "谷底有牙，不要掉下去",
      spawn: { x: 78, y: 405 },
      exit: { x: 700, y: 200 },
      base: { x: 22, y: 418, w: 108, h: 16 },
      walls: [
        { x: 22, y: 434, w: 108, h: 90 }
      ],
      spikes: [
        { x: 180, y: 508, w: 700, h: 32 }
      ]
    },
    {
      name: "裂柱",
      sub: "PILLAR",
      lives: 8,
      hint: "先叠高，再越过石柱",
      spawn: { x: 78, y: 445 },
      exit: { x: 780, y: 160 },
      base: { x: 22, y: 458, w: 108, h: 16 },
      walls: [
        { x: 400, y: 250, w: 28, h: 290 }
      ],
      spikes: [
        { x: 180, y: 508, w: 700, h: 32 }
      ]
    },
    {
      name: "天门",
      sub: "GATE",
      lives: 8,
      hint: "叠过石门，门在更高处",
      spawn: { x: 78, y: 445 },
      exit: { x: 810, y: 108 },
      base: { x: 22, y: 458, w: 108, h: 16 },
      walls: [
        { x: 520, y: 168, w: 28, h: 372 },
        { x: 720, y: 300, w: 22, h: 240 }
      ],
      spikes: [
        { x: 180, y: 508, w: 700, h: 32 }
      ]
    }
  ];

  function borders() {
    return [
      { x: 0, y: 0, w: 20, h: VH },
      { x: VW - 20, y: 0, w: 20, h: VH },
      { x: 0, y: 0, w: VW, h: 20 }
    ];
  }

  function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function makeState(stageIndex) {
    const s = STAGES[stageIndex];
    return {
      stageIndex,
      lives: s.lives,
      livesMax: s.lives,
      px: s.spawn.x,
      py: s.spawn.y,
      vx: 0,
      vy: 0,
      facing: 1,
      grounded: false,
      coyote: 0,
      buffer: 0,
      jumpHeld: false,
      didCut: false,
      airborne: false,
      jumpOriginY: s.spawn.y,
      jumpOriginX: s.spawn.x,
      ghosts: [],
      lastSx: -9999,
      lastSy: -9999,
      echoes: [],
      solids: borders().concat([s.base], s.walls || []),
      spikes: (s.spikes || []).slice(),
      exit: { x: s.exit.x, y: s.exit.y },
      spawn: { x: s.spawn.x, y: s.spawn.y },
      base: s.base,
      time: 0,
      invuln: 0,
      phase: "play",
      phaseT: 0,
      shake: 0,
      squash: 1,
      stretch: 1,
      won: false,
      lost: false
    };
  }

  function playerRect(st) {
    return {
      x: st.px - PW * 0.5,
      y: st.py - PH * 0.5,
      w: PW,
      h: PH
    };
  }

  function hitsSolid(st, x, y, w, h) {
    for (let i = 0; i < st.solids.length; i++) {
      const s = st.solids[i];
      if (rectsOverlap(x, y, w, h, s.x, s.y, s.w, s.h)) return s;
    }
    return null;
  }

  function trySample(st) {
    if (!st.airborne || st.phase !== "play") return;
    const risen = st.jumpOriginY - st.py;
    const run = Math.abs(st.px - st.jumpOriginX);
    if (risen < 10 && run < 26) return;
    const dx = st.px - st.lastSx;
    const dy = st.py - st.lastSy;
    if (st.ghosts.length && dx * dx + dy * dy < SAMPLE_MIN * SAMPLE_MIN) return;
    if (st.py > KILL_Y - 58) return;
    if (st.py < 26) return;
    st.ghosts.push({ x: st.px, y: st.py });
    st.lastSx = st.px;
    st.lastSy = st.py;
  }

  function commitGhosts(st) {
    let added = 0;
    for (let i = 0; i < st.ghosts.length; i++) {
      const g = st.ghosts[i];
      const top = g.y + PH * 0.5 + 5;
      const left = g.x - EW * 0.5;
      if (top > VH - 56 || top < 34) continue;
      if (left + EW < 28 || left > VW - 28) continue;
      if (hitsSolid(st, left + 8, top, EW - 16, EH)) continue;
      if (hitsSpike(st, left + 12, top - 6, EW - 24, EH + 4)) continue;
      let near = false;
      for (let j = 0; j < st.echoes.length; j++) {
        const e = st.echoes[j];
        const cx = e.x + e.w * 0.5;
        if (Math.abs(cx - g.x) < 24 && Math.abs(e.y - top) < 13) {
          near = true;
          break;
        }
      }
      if (near) continue;
      st.echoes.push({ x: left, y: top, w: EW, h: EH, born: st.time });
      added++;
    }
    st.ghosts.length = 0;
    return added;
  }

  function hitsSpike(st, x, y, w, h) {
    for (let i = 0; i < st.spikes.length; i++) {
      const s = st.spikes[i];
      const inset = 3;
      if (rectsOverlap(x, y, w, h, s.x + inset, s.y + inset, s.w - inset * 2, s.h - inset * 2)) {
        return true;
      }
    }
    return false;
  }

  function landEcho(st, prevBottom, left, right, bottom) {
    if (st.vy < 0) return null;
    let best = null;
    let bestTop = 1e9;
    for (let i = 0; i < st.echoes.length; i++) {
      const e = st.echoes[i];
      if (right <= e.x + 3 || left >= e.x + e.w - 3) continue;
      const top = e.y;
      if (prevBottom <= top + 20 && bottom >= top - 1) {
        if (top < bestTop) {
          bestTop = top;
          best = e;
        }
      }
    }
    return best;
  }

  function doJump(st) {
    st.vy = -JUMP_V;
    st.grounded = false;
    st.airborne = true;
    st.coyote = 0;
    st.buffer = 0;
    st.didCut = false;
    st.jumpOriginY = st.py;
    st.jumpOriginX = st.px;
    st.squash = 1.25;
    st.stretch = 0.78;
  }

  function respawn(st) {
    st.px = st.spawn.x;
    st.py = st.spawn.y;
    st.vx = 0;
    st.vy = 0;
    st.grounded = true;
    st.airborne = false;
    st.coyote = 0;
    st.buffer = 0;
    st.ghosts.length = 0;
    st.lastSx = -9999;
    st.lastSy = -9999;
    st.invuln = INVULN;
    st.phase = "play";
    st.phaseT = 0;
    st.squash = 0.7;
    st.stretch = 1.3;
  }

  function beginDie(st) {
    if (st.phase !== "play" || st.won) return false;
    st.phase = "dying";
    st.phaseT = 0;
    st.vx = 0;
    st.vy = 0;
    st.shake = 7;
    return true;
  }

  function finishDie(st) {
    commitGhosts(st);
    st.lives -= 1;
    if (st.lives <= 0) {
      st.lost = true;
      st.phase = "lost";
      st.phaseT = 0;
      return "lost";
    }
    respawn(st);
    return "respawn";
  }

  function overlapsExit(st) {
    const dx = Math.abs(st.px - st.exit.x);
    const dy = Math.abs(st.py - st.exit.y);
    return dx < EXIT_R + 16 && dy < EXIT_R + 20;
  }

  function step(st, inp, dt) {
    dt = clamp(dt, 0, 0.034);
    st.time += dt;
    if (st.shake > 0) st.shake = Math.max(0, st.shake - dt * 18);
    st.squash = lerp(st.squash, 1, clamp(dt * 12, 0, 1));
    st.stretch = lerp(st.stretch, 1, clamp(dt * 12, 0, 1));
    if (st.invuln > 0) st.invuln -= dt;

    if (st.phase === "dying") {
      st.phaseT += dt;
      if (st.phaseT >= DIE_T) return finishDie(st);
      return null;
    }
    if (st.phase !== "play" || st.won || st.lost) return null;

    if (inp.jumpTap) st.buffer = BUFFER;
    st.jumpHeld = !!inp.jumpHold;
    if (st.buffer > 0) st.buffer -= dt;
    if (st.coyote > 0) st.coyote -= dt;

    let wish = 0;
    if (inp.left) wish -= 1;
    if (inp.right) wish += 1;
    if (wish) st.facing = wish;

    const accel = st.grounded ? ACCEL_G : ACCEL_A;
    if (wish !== 0) {
      st.vx += wish * accel * dt;
      st.vx = clamp(st.vx, -MOVE, MOVE);
    } else if (st.grounded) {
      const s = Math.sign(st.vx);
      st.vx -= s * FRICTION * dt;
      if (Math.sign(st.vx) !== s) st.vx = 0;
    } else {
      st.vx *= Math.max(0, 1 - dt * 0.6);
    }

    if (st.buffer > 0 && (st.grounded || st.coyote > 0)) {
      doJump(st);
    }

    if (!st.jumpHeld && st.vy < 0 && !st.didCut) {
      st.vy *= 0.48;
      st.didCut = true;
    }

    st.vy += GRAVITY * dt;
    if (st.vy > MAX_FALL) st.vy = MAX_FALL;

    const prevBottom = st.py + PH * 0.5;
    const wasGrounded = st.grounded;

    st.px += st.vx * dt;
    let pr = playerRect(st);
    let hit = hitsSolid(st, pr.x, pr.y, pr.w, pr.h);
    if (hit) {
      if (st.vx > 0) st.px = hit.x - PW * 0.5;
      else if (st.vx < 0) st.px = hit.x + hit.w + PW * 0.5;
      else {
        const cx = st.px;
        const hx = hit.x + hit.w * 0.5;
        st.px = cx < hx ? hit.x - PW * 0.5 : hit.x + hit.w + PW * 0.5;
      }
      st.vx = 0;
    }

    st.py += st.vy * dt;
    pr = playerRect(st);
    hit = hitsSolid(st, pr.x, pr.y, pr.w, pr.h);
    st.grounded = false;
    if (hit) {
      if (st.vy >= 0 && prevBottom <= hit.y + 8) {
        st.py = hit.y - PH * 0.5;
        st.vy = 0;
        st.grounded = true;
        st.airborne = false;
        if (!wasGrounded) {
          st.squash = 0.72;
          st.stretch = 1.28;
        }
      } else if (st.vy < 0) {
        st.py = hit.y + hit.h + PH * 0.5;
        st.vy = 0;
      } else {
        st.py = hit.y - PH * 0.5;
        st.vy = 0;
        st.grounded = true;
        st.airborne = false;
      }
    } else {
      const echo = landEcho(st, prevBottom, pr.x, pr.x + pr.w, st.py + PH * 0.5);
      if (echo) {
        st.py = echo.y - PH * 0.5;
        st.vy = 0;
        st.grounded = true;
        st.airborne = false;
        if (!wasGrounded) {
          st.squash = 0.75;
          st.stretch = 1.22;
        }
      }
    }

    if (st.grounded) {
      st.coyote = COYOTE;
      st.airborne = false;
    } else if (!st.airborne) {
      st.airborne = true;
      st.jumpOriginY = st.py;
    }

    trySample(st);

    if (overlapsExit(st)) {
      st.won = true;
      st.phase = "won";
      st.phaseT = 0;
      return "won";
    }

    pr = playerRect(st);
    if (st.py > KILL_Y) {
      beginDie(st);
      return "dying";
    }
    if (st.invuln <= 0 && hitsSpike(st, pr.x, pr.y, pr.w, pr.h)) {
      beginDie(st);
      return "dying";
    }
    return null;
  }

  function greedyInput(st) {
    const dx = st.exit.x - st.px;
    const nearCeil = st.py < 70;
    const close = Math.abs(dx) < 52 && st.py <= st.exit.y + 24 && st.py >= st.exit.y - 56;
    const jump = !nearCeil && !close;
    return {
      left: dx < -10,
      right: dx > 10,
      jumpHold: jump,
      jumpTap: jump && (st.grounded || st.coyote > 0.02)
    };
  }

  function simulateStage(index, maxTime) {
    const st = makeState(index);
    const dt = 1 / 60;
    let t = 0;
    let deaths = 0;
    let echoLands = 0;
    let minY = 9999;
    const limit = maxTime || 45;
    while (t < limit && !st.won && !st.lost) {
      const wasG = st.grounded;
      const ev = step(st, greedyInput(st), dt);
      if (!wasG && st.grounded) {
        const onBase = st.py + PH * 0.5 <= st.base.y + 2 && st.py + PH * 0.5 >= st.base.y - 4
          && st.px > st.base.x && st.px < st.base.x + st.base.w;
        if (!onBase) echoLands++;
      }
      if (st.py < minY) minY = st.py;
      if (ev === "dying") {
        while (st.phase === "dying" && t < limit) {
          step(st, greedyInput(st), dt);
          t += dt;
        }
        deaths++;
      }
      t += dt;
    }
    let maxEchoX = 0;
    let minEchoY = 9999;
    for (let i = 0; i < st.echoes.length; i++) {
      const e = st.echoes[i];
      if (e.x + e.w > maxEchoX) maxEchoX = e.x + e.w;
      if (e.y < minEchoY) minEchoY = e.y;
    }
    return {
      name: STAGES[index].name,
      won: st.won,
      lost: st.lost,
      livesLeft: st.lives,
      deaths,
      echoes: st.echoes.length,
      echoLands,
      minY: Math.round(minY),
      maxEchoX: Math.round(maxEchoX),
      minEchoY: minEchoY === 9999 ? 0 : Math.round(minEchoY),
      t: Math.round(t * 10) / 10,
      x: Math.round(st.px),
      y: Math.round(st.py)
    };
  }

  function validateStages() {
    const h = jumpHeight();
    if (h < 90 || h > 160) throw new Error("jump height " + h);
    STAGES.forEach((s, i) => {
      if (!s.name || !s.sub) throw new Error("stage meta " + i);
      if (s.lives < 3) throw new Error("lives " + i);
      const maxClimb = (s.lives - 1) * (h - 16) + h;
      const need = s.base.y - s.exit.y;
      if (need > maxClimb + 30) throw new Error("stage " + i + " too high " + need + " > " + maxClimb);
    });
  }

  if (typeof document === "undefined") {
    validateStages();
    const results = STAGES.map((_, i) => simulateStage(i, 50));
    results.forEach((r) => {
      const mark = r.won ? "OK" : "FAIL";
      console.log(mark, r.name, "t=" + r.t, "deaths=" + r.deaths, "lives=" + r.livesLeft, "echoes=" + r.echoes, "lands=" + r.echoLands, "minY=" + r.minY, "echoX=" + r.maxEchoX, "echoY=" + r.minEchoY, "pos", r.x, r.y);
    });
    const failed = results.filter((r) => !r.won);
    if (failed.length) {
      console.error("unreachable", failed.map((f) => f.name).join(","));
      process.exitCode = 1;
    } else {
      console.log("ghost-jump maps ok", STAGES.length, "jump", Math.round(jumpHeight()));
    }
    return;
  }

  validateStages();

  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d", { alpha: false });
  const overlay = document.getElementById("overlay");
  const ovKicker = document.getElementById("ov-kicker");
  const ovTitle = document.getElementById("ov-title");
  const ovLead = document.getElementById("ov-lead");
  const ovOps = document.getElementById("ov-ops");
  const ovBtn = document.getElementById("ov-btn");
  const stageLabel = document.getElementById("stage-label");
  const pipsEl = document.getElementById("pips");
  const toastEl = document.getElementById("toast");
  const hintEl = document.getElementById("hint");
  const btnMute = document.getElementById("btn-mute");
  const btnRetry = document.getElementById("btn-retry");
  const padEl = document.getElementById("pad");
  const btnLeft = document.getElementById("btn-left");
  const btnRight = document.getElementById("btn-right");
  const btnJump = document.getElementById("btn-jump");
  const stageEl = document.getElementById("stage");

  const coarse = window.matchMedia("(pointer: coarse)").matches;
  if (coarse) {
    hintEl.textContent = "左 / 右移动 · 跳 · 摔下去脚印才会凝固";
    padEl.style.display = "flex";
  }

  const keys = { left: false, right: false, jump: false };
  const pad = { left: false, right: false, jump: false };
  const pointer = { down: false, jumpQueued: false, x: 0, y: 0, sx: 0, t: 0, id: null };

  const view = { scale: 1, ox: 0, oy: 0, cssW: 1, cssH: 1, dpr: 1 };
  const stars = [];
  const particles = [];
  const after = [];

  let mode = "title";
  let overlayKind = "title";
  let st = makeState(0);
  let toastT = 0;
  let flash = 0;
  let flashRgb = "0,240,255";
  let frozen = false;
  let runId = 0;
  let landNote = 0;

  function burst(x, y, rgb, n, spd) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = spd * (0.2 + Math.random());
      particles.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        t: 0,
        life: 0.28 + Math.random() * 0.5,
        rgb,
        r: 1.1 + Math.random() * 2.2
      });
    }
  }

  function makeStars() {
    stars.length = 0;
    for (let i = 0; i < 70; i++) {
      stars.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        r: Math.random() * 1.4 + 0.25,
        a: Math.random() * 0.45 + 0.08,
        p: Math.random() * Math.PI * 2
      });
    }
  }
  makeStars();

  const SFX = {
    ctx: null,
    master: null,
    muted: false,
    ensure() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.8;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
    },
    beep(freq, dur, type, vol, slide) {
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
    noise(dur, vol) {
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
    jump() {
      this.ensure();
      this.beep(520, 0.12, "triangle", 0.07, 880);
    },
    land() {
      this.ensure();
      this.beep(190, 0.07, "sine", 0.04, 90);
    },
    die() {
      this.ensure();
      this.noise(0.16, 0.1);
      this.beep(280, 0.42, "sawtooth", 0.07, 60);
    },
    echo() {
      this.ensure();
      this.beep(660, 0.14, "sine", 0.06, 990);
      this.beep(440, 0.2, "triangle", 0.04, 220);
    },
    win() {
      this.ensure();
      this.beep(440, 0.16, "sine", 0.08, 660);
      setTimeout(() => this.beep(660, 0.18, "sine", 0.08, 880), 100);
      setTimeout(() => this.beep(880, 0.32, "sine", 0.1, 1320), 210);
    },
    clear() {
      this.ensure();
      this.beep(520, 0.14, "sine", 0.07, 780);
      setTimeout(() => this.beep(780, 0.2, "sine", 0.07, 1040), 90);
    },
    deny() {
      this.ensure();
      this.beep(140, 0.1, "square", 0.04, 80);
    }
  };

  try {
    if (localStorage.getItem("ghost-jump-mute") === "1") SFX.muted = true;
  } catch (_) { /* ignore */ }

  function syncMuteBtn() {
    btnMute.textContent = SFX.muted ? "静" : "声";
    btnMute.classList.toggle("muted", SFX.muted);
  }
  syncMuteBtn();

  function setMuted(m) {
    SFX.muted = m;
    if (SFX.master) SFX.master.gain.value = m ? 0 : 0.8;
    syncMuteBtn();
    try { localStorage.setItem("ghost-jump-mute", m ? "1" : "0"); } catch (_) { /* ignore */ }
  }

  function showToast(text) {
    toastEl.textContent = text;
    toastEl.classList.remove("hidden");
    toastT = 1.5;
  }

  function renderHud() {
    if (mode === "title") {
      stageLabel.textContent = "脚印成路";
    } else {
      const s = STAGES[st.stageIndex];
      stageLabel.textContent = (st.stageIndex + 1) + " / " + STAGES.length + "　" + s.name;
    }
    pipsEl.innerHTML = "";
    const max = mode === "title" ? 0 : st.livesMax;
    for (let i = 0; i < max; i++) {
      const pip = document.createElement("span");
      pip.className = "pip";
      if (i < st.lives) {
        pip.classList.add("on");
        if (st.lives <= 2 && mode === "play") pip.classList.add("warn");
      }
      pipsEl.appendChild(pip);
    }
  }

  function setOverlay(kind) {
    overlayKind = kind;
    overlay.classList.remove("hidden");
    frozen = true;
    if (kind === "title") {
      ovKicker.textContent = "ECHO JUMP";
      ovTitle.textContent = "叠跳";
      ovLead.textContent = "空中没有平台。跳跃留下残影，摔下去才会凝固成路。叠几条命，走到青色出口。";
      ovOps.textContent = coarse
        ? "左 / 右移动 · 跳 · 共五关 · M 静音"
        : "方向键 / WASD 移动 · 上 / W / 空格跳跃 · 点画布也可跳 · M 静音";
      ovBtn.textContent = "开始";
    } else if (kind === "dead") {
      ovKicker.textContent = "LOST";
      ovTitle.textContent = "脚印散尽";
      ovLead.textContent = "命用完了。残影还停在半空，门仍在更上面。";
      ovOps.textContent = "重开本关会清掉所有回声平台。";
      ovBtn.textContent = "重试本关";
    } else if (kind === "clear") {
      const left = STAGES.length - st.stageIndex - 1;
      ovKicker.textContent = "ECHO";
      ovTitle.textContent = "残影成路";
      ovLead.textContent = "你踩着自己的坠落走到了门。还剩 " + left + " 扇门。";
      ovOps.textContent = "";
      ovBtn.textContent = "下一关";
    } else if (kind === "win") {
      ovKicker.textContent = "STILL";
      ovTitle.textContent = "五跳落定";
      ovLead.textContent = "所有路都是你摔出来的。门开了，山谷里只剩回声。";
      ovOps.textContent = "";
      ovBtn.textContent = "再来一局";
    }
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
    frozen = false;
    overlayKind = "none";
  }

  function loadTitle() {
    runId++;
    mode = "title";
    st = makeState(0);
    st.echoes = demoEchoes();
    particles.length = 0;
    after.length = 0;
    setOverlay("title");
    renderHud();
  }

  function demoEchoes() {
    const list = [];
    const x0 = 210;
    const y0 = 400;
    for (let i = 0; i < 9; i++) {
      const t = i / 8;
      const x = x0 + t * 220;
      const y = y0 - Math.sin(t * Math.PI) * 110;
      list.push({ x: x - 28, y: y, w: 56, h: 11, born: -2 - i * 0.05 });
    }
    return list;
  }

  function loadStage(i) {
    runId++;
    mode = "play";
    st = makeState(i);
    particles.length = 0;
    after.length = 0;
    flash = 0.35;
    flashRgb = "0,240,255";
    hideOverlay();
    renderHud();
    showToast((i + 1) + " / " + STAGES.length + "　" + STAGES[i].name + " · " + STAGES[i].hint);
    hintEl.textContent = coarse
      ? STAGES[i].hint + " · 左 / 右 / 跳"
      : STAGES[i].hint + " · WASD 移动 · 空格跳跃 · M 静音";
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

  function gatherInput() {
    let left = keys.left || pad.left;
    let right = keys.right || pad.right;
    let jumpHold = keys.jump || pad.jump;
    let jumpTap = false;

    if (pointer.down && pointer.id !== "pad") {
      const third = view.cssW;
      if (pointer.x < third * 0.28) left = true;
      else if (pointer.x > third * 0.72) right = true;
    }
    if (pointer.jumpQueued) {
      jumpTap = true;
      pointer.jumpQueued = false;
    }
    return { left, right, jumpHold, jumpTap };
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

  function drawWorld() {
    const dpr = view.dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#05030c";
    ctx.fillRect(0, 0, view.cssW, view.cssH);

    const shx = (st.shake ? (Math.random() - 0.5) * st.shake : 0);
    const shy = (st.shake ? (Math.random() - 0.5) * st.shake : 0);
    ctx.translate(view.ox + shx, view.oy + shy);
    ctx.scale(view.scale, view.scale);

    const g = ctx.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, "#0a0716");
    g.addColorStop(0.55, "#070412");
    g.addColorStop(1, "#140814");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, VH);

    ctx.save();
    ctx.globalAlpha = 0.55;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const tw = 0.55 + Math.sin(st.time * 1.4 + s.p) * 0.45;
      ctx.fillStyle = "rgba(230,236,255," + (s.a * tw) + ")";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.strokeStyle = "rgba(0,240,255,0.045)";
    ctx.lineWidth = 1;
    for (let x = 40; x < VW; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 20);
      ctx.lineTo(x, VH);
      ctx.stroke();
    }
    for (let y = 40; y < VH; y += 40) {
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(VW - 20, y);
      ctx.stroke();
    }

    const mist = ctx.createLinearGradient(0, 430, 0, VH);
    mist.addColorStop(0, "rgba(255,61,184,0)");
    mist.addColorStop(1, "rgba(255,61,184,0.16)");
    ctx.fillStyle = mist;
    ctx.fillRect(0, 420, VW, VH - 420);

    drawExit();
    drawSolids();
    drawSpikes();
    drawEchoes();
    drawGhosts();
    drawParticles();
    if (mode !== "title") drawPlayer();
    else drawTitleGhost();

    ctx.fillStyle = "rgba(5,3,12,0.35)";
    ctx.fillRect(0, 0, 20, VH);
    ctx.fillRect(VW - 20, 0, 20, VH);
    ctx.fillRect(0, 0, VW, 20);

    const vig = ctx.createRadialGradient(VW * 0.5, VH * 0.45, 80, VW * 0.5, VH * 0.5, 560);
    vig.addColorStop(0, "rgba(5,3,12,0)");
    vig.addColorStop(1, "rgba(5,3,12,0.42)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, VW, VH);

    if (flash > 0) {
      ctx.fillStyle = "rgba(" + flashRgb + "," + (flash * 0.28) + ")";
      ctx.fillRect(0, 0, VW, VH);
    }
  }

  function drawSolids() {
    for (let i = 0; i < st.solids.length; i++) {
      const s = st.solids[i];
      const isBase = s === st.base;
      ctx.save();
      if (isBase) {
        ctx.shadowColor = "rgba(255,227,107,0.35)";
        ctx.shadowBlur = 16;
        ctx.fillStyle = "#2a2038";
        drawRoundRect(s.x, s.y, s.w, s.h, 5);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(255,227,107,0.7)";
        ctx.fillRect(s.x + 4, s.y, s.w - 8, 3);
      } else {
        ctx.fillStyle = "#161022";
        ctx.fillRect(s.x, s.y, s.w, s.h);
        ctx.strokeStyle = "rgba(0,240,255,0.22)";
        ctx.lineWidth = 1;
        ctx.strokeRect(s.x + 0.5, s.y + 0.5, s.w - 1, s.h - 1);
        ctx.fillStyle = "rgba(255,61,184,0.12)";
        ctx.fillRect(s.x, s.y, 3, s.h);
      }
      ctx.restore();
    }
  }

  function drawSpikes() {
    for (let i = 0; i < st.spikes.length; i++) {
      const s = st.spikes[i];
      const teeth = Math.max(3, Math.floor(s.w / 14));
      const tw = s.w / teeth;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y + s.h);
      for (let k = 0; k < teeth; k++) {
        const x0 = s.x + k * tw;
        ctx.lineTo(x0 + tw * 0.5, s.y);
        ctx.lineTo(x0 + tw, s.y + s.h);
      }
      ctx.closePath();
      ctx.fillStyle = "#3a1028";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,61,184,0.85)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }

  function drawEchoes() {
    for (let i = 0; i < st.echoes.length; i++) {
      const e = st.echoes[i];
      const age = st.time - e.born;
      const pop = age < 0.28 ? 0.72 + 0.28 * (age / 0.28) : 1;
      const glow = 0.3 + Math.sin(st.time * 3 + i * 0.4) * 0.08;
      const cx = e.x + e.w * 0.5;
      const cy = e.y + e.h * 0.5;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(pop, pop);
      ctx.fillStyle = "rgba(0,240,255," + (0.1 + glow * 0.18) + ")";
      drawRoundRect(-e.w * 0.5 - 5, -e.h * 0.5 - 4, e.w + 10, e.h + 8, 7);
      ctx.fill();
      ctx.fillStyle = "#0b3d48";
      drawRoundRect(-e.w * 0.5, -e.h * 0.5, e.w, e.h, 4);
      ctx.fill();
      ctx.fillStyle = "rgba(0,240,255,0.92)";
      ctx.fillRect(-e.w * 0.5 + 6, -e.h * 0.5, e.w - 12, 3);
      ctx.restore();
    }
  }

  function drawGhosts() {
    const dying = st.phase === "dying";
    const k = dying ? clamp(st.phaseT / DIE_T, 0, 1) : 0;
    if (st.ghosts.length > 1) {
      ctx.beginPath();
      ctx.moveTo(st.ghosts[0].x, st.ghosts[0].y);
      for (let i = 1; i < st.ghosts.length; i++) {
        ctx.lineTo(st.ghosts[i].x, st.ghosts[i].y);
      }
      ctx.strokeStyle = "rgba(255,61,184," + (0.28 + k * 0.45) + ")";
      ctx.lineWidth = 2 + k * 3;
      ctx.stroke();
    }
    for (let i = 0; i < st.ghosts.length; i++) {
      const g = st.ghosts[i];
      const a = 0.25 + 0.35 * Math.sin(st.time * 8 + i);
      const r = 4 + k * 6;
      ctx.fillStyle = k > 0.4
        ? "rgba(0,240,255," + (0.35 + k * 0.5) + ")"
        : "rgba(255,61,184," + (0.45 + a * 0.25) + ")";
      ctx.beginPath();
      ctx.moveTo(g.x, g.y - r);
      ctx.lineTo(g.x + r * 0.8, g.y);
      ctx.lineTo(g.x, g.y + r);
      ctx.lineTo(g.x - r * 0.8, g.y);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawExit() {
    const x = st.exit.x;
    const y = st.exit.y;
    const t = st.time;
    ctx.save();
    ctx.translate(x, y);
    ctx.shadowColor = "rgba(0,240,255,0.8)";
    ctx.shadowBlur = 22;
    ctx.strokeStyle = "rgba(0,240,255,0.85)";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, EXIT_R + Math.sin(t * 3) * 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.rotate(t * 0.7);
    ctx.strokeStyle = "rgba(255,227,107,0.7)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(0, 0, EXIT_R * 0.62, EXIT_R * 0.28, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.rotate(-t * 1.6);
    ctx.beginPath();
    ctx.ellipse(0, 0, EXIT_R * 0.28, EXIT_R * 0.62, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(0,240,255,0.55)";
    ctx.beginPath();
    ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (mode === "play") {
      ctx.fillStyle = "rgba(122,246,255,0.7)";
      ctx.font = "10px Segoe UI, PingFang SC, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("出口", x, y - EXIT_R - 8);
    }
  }

  function drawGhostBody(x, y, facing, alpha, sq, stch, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(facing * stch, sq);
    ctx.globalAlpha = alpha;
    ctx.shadowColor = "rgba(255,61,184,0.85)";
    ctx.shadowBlur = 16;
    ctx.fillStyle = "#ff3db8";
    ctx.beginPath();
    ctx.ellipse(0, -1, 8.5, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-7, 4);
    const wave = Math.sin(t * 8) * 1.6;
    ctx.quadraticCurveTo(-6, 12 + wave, 0, 13);
    ctx.quadraticCurveTo(6, 12 - wave, 7, 4);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#041018";
    ctx.beginPath();
    ctx.ellipse(-3.2, -3.5, 2.1, 2.6, 0, 0, Math.PI * 2);
    ctx.ellipse(3.2, -3.5, 2.1, 2.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#00f0ff";
    ctx.beginPath();
    ctx.arc(-3.1, -3.3, 1.05, 0, Math.PI * 2);
    ctx.arc(3.3, -3.3, 1.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawPlayer() {
    const hide = st.invuln > 0 && st.phase === "play" && Math.floor(st.time * 18) % 2 === 0;
    for (let i = 0; i < after.length; i++) {
      const a = after[i];
      const al = 0.08 + i / after.length * 0.18;
      drawGhostBody(a.x, a.y, a.f, al, 1, 1, st.time - i * 0.05);
    }
    if (st.phase === "dying") {
      const k = st.phaseT / DIE_T;
      drawGhostBody(st.px, st.py, st.facing, 1 - k, 1 + k * 0.8, 1 - k * 0.4, st.time);
      return;
    }
    if (!hide) {
      drawGhostBody(st.px, st.py, st.facing, 1, st.squash, st.stretch, st.time);
    }
  }

  function drawTitleGhost() {
    const x = 120 + Math.sin(st.time * 1.3) * 8;
    const y = 430 + Math.sin(st.time * 2.1) * 4;
    drawGhostBody(x, y, 1, 0.9, 1, 1, st.time);
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const k = 1 - p.t / p.life;
      ctx.fillStyle = "rgba(" + p.rgb + "," + (k * 0.85) + ")";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * k, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function tickParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 40 * dt;
      if (p.t >= p.life) particles.splice(i, 1);
    }
    if (mode === "play" && st.phase === "play") {
      after.push({ x: st.px, y: st.py, f: st.facing });
      if (after.length > 7) after.shift();
    } else if (after.length) {
      after.shift();
    }
  }

  function onEvent(ev) {
    if (ev === "dying") {
      SFX.die();
      flash = 0.45;
      flashRgb = "255,61,184";
      burst(st.px, st.py, "255,61,184", 22, 160);
      showToast("脚印落下");
    } else if (ev === "respawn") {
      SFX.echo();
      flash = 0.32;
      flashRgb = "0,240,255";
      burst(st.spawn.x, st.spawn.y, "0,240,255", 12, 90);
      renderHud();
      showToast("第 " + (st.livesMax - st.lives + 1) + " 次叠跳");
    } else if (ev === "lost") {
      SFX.die();
      renderHud();
      setOverlay("dead");
    } else if (ev === "won") {
      const id = runId;
      if (st.stageIndex >= STAGES.length - 1) {
        SFX.win();
        burst(st.exit.x, st.exit.y, "255,227,107", 28, 140);
        setTimeout(() => { if (runId === id) setOverlay("win"); }, 420);
      } else {
        SFX.clear();
        burst(st.exit.x, st.exit.y, "0,240,255", 22, 120);
        setTimeout(() => { if (runId === id) setOverlay("clear"); }, 360);
      }
    }
  }

  let acc = 0;
  let lastTs = 0;

  function frame(ts) {
    requestAnimationFrame(frame);
    if (!lastTs) lastTs = ts;
    let dt = (ts - lastTs) / 1000;
    lastTs = ts;
    if (dt > 0.08) dt = 0.08;
    acc += dt;
    fit();

    if (toastT > 0) {
      toastT -= dt;
      if (toastT <= 0) toastEl.classList.add("hidden");
    }
    if (flash > 0) flash = Math.max(0, flash - dt * 2.2);

    const stepDt = 1 / 60;
    while (acc >= stepDt) {
      acc -= stepDt;
      if (mode === "title") {
        st.time += stepDt;
      } else if (!frozen) {
        const inp = gatherInput();
        const wasG = st.grounded;
        const wasAir = st.airborne;
        const ev = step(st, inp, stepDt);
        if (!wasAir && st.airborne && st.vy < 0) {
          SFX.jump();
          burst(st.px, st.py + PH * 0.4, "255,61,184", 6, 70);
        }
        if (!wasG && st.grounded && st.time > landNote + 0.08) {
          landNote = st.time;
          SFX.land();
        }
        if (ev) onEvent(ev);
      } else {
        st.time += stepDt * 0.35;
      }
      tickParticles(stepDt);
    }

    drawWorld();
  }

  function confirmOverlay() {
    SFX.ensure();
    if (overlayKind === "title") {
      loadStage(0);
    } else if (overlayKind === "dead") {
      loadStage(st.stageIndex);
    } else if (overlayKind === "clear") {
      loadStage(st.stageIndex + 1);
    } else if (overlayKind === "win") {
      loadStage(0);
    }
  }

  ovBtn.addEventListener("click", (e) => {
    e.preventDefault();
    confirmOverlay();
  });

  btnRetry.addEventListener("click", (e) => {
    e.preventDefault();
    SFX.ensure();
    if (mode === "title" || overlayKind === "win") {
      loadStage(0);
      return;
    }
    loadStage(st.stageIndex);
  });

  btnMute.addEventListener("click", (e) => {
    e.preventDefault();
    SFX.ensure();
    setMuted(!SFX.muted);
  });

  function bindHold(el, key) {
    const on = (ev) => {
      ev.preventDefault();
      pad[key] = true;
      el.classList.add("held");
      if (key === "jump") pointer.jumpQueued = true;
      SFX.ensure();
    };
    const off = (ev) => {
      if (ev) ev.preventDefault();
      pad[key] = false;
      el.classList.remove("held");
    };
    el.addEventListener("pointerdown", on);
    el.addEventListener("pointerup", off);
    el.addEventListener("pointercancel", off);
    el.addEventListener("pointerleave", (ev) => {
      if (pad[key]) off(ev);
    });
  }
  bindHold(btnLeft, "left");
  bindHold(btnRight, "right");
  bindHold(btnJump, "jump");

  canvas.addEventListener("pointerdown", (e) => {
    if (frozen) return;
    const rect = canvas.getBoundingClientRect();
    pointer.down = true;
    pointer.id = e.pointerId;
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;
    pointer.sx = pointer.x;
    pointer.t = performance.now();
    pointer.jumpQueued = true;
    SFX.ensure();
    try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!pointer.down) return;
    const rect = canvas.getBoundingClientRect();
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;
  });
  function pointerEnd(e) {
    if (pointer.id !== null && e.pointerId !== pointer.id && e.type !== "blur") return;
    pointer.down = false;
    pointer.id = null;
  }
  canvas.addEventListener("pointerup", pointerEnd);
  canvas.addEventListener("pointercancel", pointerEnd);
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  window.addEventListener("keydown", (e) => {
    if (e.code === "KeyM") {
      e.preventDefault();
      SFX.ensure();
      setMuted(!SFX.muted);
      return;
    }
    if (e.code === "Enter" || (e.code === "Space" && frozen)) {
      if (frozen && !e.repeat) {
        e.preventDefault();
        confirmOverlay();
      }
      if (e.code === "Space") e.preventDefault();
      return;
    }
    if (e.code === "ArrowLeft" || e.code === "KeyA") {
      keys.left = true;
      e.preventDefault();
    }
    if (e.code === "ArrowRight" || e.code === "KeyD") {
      keys.right = true;
      e.preventDefault();
    }
    if (e.code === "ArrowUp" || e.code === "KeyW" || e.code === "Space") {
      if (!keys.jump) pointer.jumpQueued = true;
      keys.jump = true;
      e.preventDefault();
    }
    if (e.code === "KeyR" && !e.repeat) {
      e.preventDefault();
      if (mode !== "title") loadStage(st.stageIndex);
    }
  });
  window.addEventListener("keyup", (e) => {
    if (e.code === "ArrowLeft" || e.code === "KeyA") keys.left = false;
    if (e.code === "ArrowRight" || e.code === "KeyD") keys.right = false;
    if (e.code === "ArrowUp" || e.code === "KeyW" || e.code === "Space") keys.jump = false;
  });

  window.addEventListener("blur", () => {
    keys.left = keys.right = keys.jump = false;
    pad.left = pad.right = pad.jump = false;
    pointer.down = false;
  });

  window.addEventListener("resize", fit);
  window.addEventListener("touchstart", () => {
    padEl.style.display = "flex";
  }, { passive: true, once: true });

  fit();
  loadTitle();
  requestAnimationFrame(frame);
})();
