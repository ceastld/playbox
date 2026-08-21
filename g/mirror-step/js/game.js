(function () {
  "use strict";

  const N = 6;
  const PINK = "#ff3db8";
  const CYAN = "#00f0ff";
  const GOLD = "#ffe36b";
  const DIRS = {
    U: { dx: 0, dy: -1 },
    D: { dx: 0, dy: 1 },
    L: { dx: -1, dy: 0 },
    R: { dx: 1, dy: 0 },
  };

  const STAGES = [
    {
      name: "对影",
      mode: "h",
      wrap: false,
      hint: "你向右走，镜中的你向左走。两人在中间的光点会合。",
      map: ["Y#**##", "......", "......", "......", "......", "......"],
    },
    {
      name: "裂口",
      mode: "h",
      wrap: false,
      hint: "正前方裂开了。绕到下一行再会合。",
      map: ["Y#..##", ".#**##", "......", "......", "......", "......"],
    },
    {
      name: "勿右",
      mode: "h",
      wrap: false,
      hint: "那格对你是实心，对镜子却是虚空。先看镜子脚下。",
      map: ["Y#.#.#", "##.#.#", "##.#.#", "##**##", "......", "......"],
    },
    {
      name: "深巷",
      mode: "h",
      wrap: false,
      hint: "贴着左右实墙往下走。中间许多砖是诱饵。",
      map: ["Y#.###", "##.###", "##.#.#", "##.#.#", "##**##", "######"],
    },
    {
      name: "环面",
      mode: "h",
      wrap: true,
      hint: "此关边缘循环：从底边迈出，会在顶边出现。",
      map: ["##**##", "......", "Y#####", "######", "######", "##..##"],
    },
    {
      name: "倒影",
      mode: "v",
      wrap: false,
      hint: "镜子改为上下对折。你向下，镜中的你向上。",
      map: ["Y#....", "##....", "*.....", "*.....", "#.....", "#....."],
    },
    {
      name: "纵步",
      mode: "v",
      wrap: false,
      hint: "先走向开阔处，再一起踏进光点。",
      map: ["Y#####", "..#.##", ".**.##", ".**.##", "..#.##", "######"],
    },
    {
      name: "对角",
      mode: "p",
      wrap: false,
      hint: "中心对点：你的每一步，镜子都往反方向走。",
      map: ["Y#####", "#.#.#.", "#.**.#", "#.**.#", ".#.#.#", "######"],
    },
    {
      name: "对点",
      mode: "p",
      wrap: false,
      hint: "路更窄了。按镜像去想：你右下，它左上。",
      map: ["Y#....", ".##...", ".##*..", "..*###", "...##.", "....##"],
    },
    {
      name: "镜轴",
      mode: "h",
      wrap: false,
      hint: "两人贴着镜面站着。走向两侧的光。",
      map: ["*#..#*", "#....#", "##Y###", "#....#", "#....#", "######"],
    },
    {
      name: "穿镜",
      mode: "h",
      wrap: true,
      hint: "沿窄道走到边角。边缘相通，踏空仍会坠落。",
      map: ["*#..#*", ".#..#.", ".#Y##.", ".#..#.", ".#..#.", ".####."],
    },
    {
      name: "双落",
      mode: "h",
      wrap: false,
      hint: "只走双边都有砖的路。下到角落的双光点。",
      map: ["Y#.###", ".#..##", "##..##", "#....#", "#....#", "*....*"],
    },
  ];

  const canvas = document.getElementById("board");
  const overlay = document.getElementById("overlay");
  const ovKicker = document.getElementById("ov-kicker");
  const ovTitle = document.getElementById("ov-title");
  const ovMsg = document.getElementById("ov-msg");
  const ovActions = document.getElementById("ov-actions");
  const ovHelp = document.getElementById("ov-help");
  const stageLabel = document.getElementById("stage-label");
  const modeLabel = document.getElementById("mode-label");
  const stepLabel = document.getElementById("step-label");
  const hintEl = document.getElementById("hint");
  const muteBtn = document.getElementById("btn-mute");

  const MODE_NAME = { h: "横向对折", v: "纵向对折", p: "中心对点" };

  const S = {
    screen: "title",
    stage: 0,
    grid: [],
    you: { x: 0, y: 0 },
    mir: { x: 0, y: 0 },
    steps: 0,
    undo: [],
    anim: null,
    fall: null,
    burst: 0,
    shake: 0,
    hoverDir: null,
    queue: null,
    particles: [],
    stars: [],
    t0: 0,
    now: 0,
    css: 540,
    muted: false,
    lastDir: { you: { dx: 1, dy: 0 }, mir: { dx: -1, dy: 0 } },
  };

  /* ---------- audio ---------- */
  const audio = {
    ctx: null,
    muted: (function () {
      try {
        return localStorage.getItem("mirror-step-mute") === "1";
      } catch (e) {
        return false;
      }
    })(),
    ensure: function () {
      if (this.muted) return null;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      if (!this.ctx) this.ctx = new AC();
      if (this.ctx.state === "suspended") this.ctx.resume();
      return this.ctx;
    },
    tone: function (freq, dur, type, gain, delay) {
      const ctx = this.ensure();
      if (!ctx) return;
      const t = ctx.currentTime + (delay || 0);
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type || "square";
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain || 0.05, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(t);
      o.stop(t + dur + 0.02);
    },
    step: function () {
      this.tone(520, 0.07, "square", 0.035, 0);
      this.tone(780, 0.08, "square", 0.028, 0.04);
    },
    wrap: function () {
      this.tone(240, 0.12, "sine", 0.04, 0);
      this.tone(420, 0.14, "sine", 0.03, 0.05);
    },
    death: function () {
      this.tone(220, 0.28, "sawtooth", 0.05, 0);
      this.tone(110, 0.4, "triangle", 0.06, 0.08);
    },
    win: function () {
      this.tone(523, 0.12, "square", 0.04, 0);
      this.tone(659, 0.12, "square", 0.04, 0.1);
      this.tone(784, 0.18, "square", 0.045, 0.2);
    },
    all: function () {
      this.tone(523, 0.12, "square", 0.04, 0);
      this.tone(659, 0.12, "square", 0.04, 0.1);
      this.tone(784, 0.12, "square", 0.04, 0.2);
      this.tone(1046, 0.28, "square", 0.05, 0.32);
    },
  };
  S.muted = audio.muted;

  /* ---------- grid helpers ---------- */
  function mirrorPos(x, y, mode) {
    if (mode === "h") return { x: N - 1 - x, y: y };
    if (mode === "v") return { x: x, y: N - 1 - y };
    return { x: N - 1 - x, y: N - 1 - y };
  }
  function mirrorDir(dx, dy, mode) {
    if (mode === "h") return { dx: -dx, dy: dy };
    if (mode === "v") return { dx: dx, dy: -dy };
    return { dx: -dx, dy: -dy };
  }
  function st() {
    return STAGES[S.stage];
  }
  function wrapCoord(n) {
    return ((n % N) + N) % N;
  }
  function sample(x, y, wrap) {
    if (wrap) {
      x = wrapCoord(x);
      y = wrapCoord(y);
      return { x: x, y: y, c: S.grid[y][x], ok: S.grid[y][x] !== ".", wrap: true };
    }
    if (x < 0 || y < 0 || x >= N || y >= N) {
      return { x: x, y: y, c: ".", ok: false, wrap: false };
    }
    return { x: x, y: y, c: S.grid[y][x], ok: S.grid[y][x] !== ".", wrap: false };
  }

  function loadStage(i) {
    S.stage = i;
    const s = STAGES[i];
    let sx = 0;
    let sy = 0;
    S.grid = s.map.map(function (row, y) {
      return row.split("").map(function (ch, x) {
        if (ch === "Y") {
          sx = x;
          sy = y;
          return "#";
        }
        return ch;
      });
    });
    S.you = { x: sx, y: sy };
    S.mir = mirrorPos(sx, sy, s.mode);
    S.steps = 0;
    S.undo = [];
    S.anim = null;
    S.fall = null;
    S.burst = 0;
    S.queue = null;
    S.hoverDir = null;
    S.lastDir = {
      you: s.mode === "v" ? { dx: 0, dy: 1 } : { dx: 1, dy: 0 },
      mir: s.mode === "v" ? { dx: 0, dy: -1 } : { dx: -1, dy: 0 },
    };
    S.particles = [];
    S.shake = 0;
    seedStars();
    syncHud();
  }

  function syncHud() {
    const s = st();
    stageLabel.textContent = "关卡 " + (S.stage + 1) + " / " + STAGES.length + "  " + s.name;
    modeLabel.textContent = MODE_NAME[s.mode] + (s.wrap ? " · 循环" : "");
    stepLabel.textContent = S.steps + " 步";
    hintEl.textContent = s.hint;
    muteBtn.textContent = audio.muted ? "开声" : "静音";
  }

  function snapshot() {
    return {
      x: S.you.x,
      y: S.you.y,
      mx: S.mir.x,
      my: S.mir.y,
      steps: S.steps,
      last: {
        you: { dx: S.lastDir.you.dx, dy: S.lastDir.you.dy },
        mir: { dx: S.lastDir.mir.dx, dy: S.lastDir.mir.dy },
      },
    };
  }

  function restore(p) {
    S.you = { x: p.x, y: p.y };
    S.mir = { x: p.mx, y: p.my };
    S.steps = p.steps;
    S.lastDir = p.last;
    S.anim = null;
    S.fall = null;
    S.burst = 0;
    S.shake = 0;
    S.queue = null;
    S.screen = "play";
    hideOverlay();
    syncHud();
  }

  /* ---------- movement ---------- */
  function tryMove(dirKey) {
    if (S.screen === "title" || S.screen === "allclear") return;
    if (S.screen === "dead") return;
    if (S.anim || S.fall || S.burst > 0) {
      if (S.screen === "play") S.queue = dirKey;
      return;
    }
    if (S.screen === "clear") {
      nextStage();
      return;
    }
    const d = DIRS[dirKey];
    if (!d) return;
    const s = st();
    const md = mirrorDir(d.dx, d.dy, s.mode);
    const a = sample(S.you.x + d.dx, S.you.y + d.dy, s.wrap);
    const b = sample(S.mir.x + md.dx, S.mir.y + md.dy, s.wrap);
    const youWrap = s.wrap && (a.x !== S.you.x + d.dx || a.y !== S.you.y + d.dy);
    const mirWrap = s.wrap && (b.x !== S.mir.x + md.dx || b.y !== S.mir.y + md.dy);

    S.undo.push(snapshot());
    S.lastDir = { you: d, mir: md };
    S.steps += 1;
    syncHud();

    S.anim = {
      fromY: { x: S.you.x, y: S.you.y },
      fromM: { x: S.mir.x, y: S.mir.y },
      toY: { x: a.x, y: a.y },
      toM: { x: b.x, y: b.y },
      youWrap: youWrap,
      mirWrap: mirWrap,
      t: 0,
      dur: youWrap || mirWrap ? 0.22 : 0.14,
      safe: a.ok && b.ok,
      youOk: a.ok,
      mirOk: b.ok,
    };
    S.you = { x: a.x, y: a.y };
    S.mir = { x: b.x, y: b.y };

    if (youWrap || mirWrap) audio.wrap();
    else audio.step();
    spark(cellCenter(S.anim.fromY.x, S.anim.fromY.y), PINK, 5);
    spark(cellCenter(S.anim.fromM.x, S.anim.fromM.y), CYAN, 5);
  }

  function finishAnim() {
    const a = S.anim;
    S.anim = null;
    if (!a.safe) {
      beginFall(a);
      return;
    }
    if (S.grid[S.you.y][S.you.x] === "*" && S.grid[S.mir.y][S.mir.x] === "*") {
      beginWin();
      return;
    }
    if (S.queue) {
      const q = S.queue;
      S.queue = null;
      tryMove(q);
    }
  }

  function beginFall(a) {
    S.screen = "dead";
    S.shake = 9;
    audio.death();
    S.fall = {
      t: 0,
      dur: 0.7,
      youOk: a.youOk,
      mirOk: a.mirOk,
    };
    const who = !a.youOk && !a.mirOk ? "both" : !a.youOk ? "you" : "mir";
    spark(cellCenter(S.you.x, S.you.y), who === "mir" ? CYAN : PINK, 18);
    spark(cellCenter(S.mir.x, S.mir.y), who === "you" ? PINK : CYAN, 18);
  }

  function beginWin() {
    S.burst = 1.15;
    S.screen = "clear";
    audio.win();
    spark(cellCenter(S.you.x, S.you.y), GOLD, 16);
    spark(cellCenter(S.mir.x, S.mir.y), GOLD, 16);
  }

  function showDeath() {
    const f = S.fall;
    let msg = "双双踏入虚空。";
    if (f.youOk && !f.mirOk) msg = "你落在实砖上，镜中的你却踏空了。";
    else if (!f.youOk && f.mirOk) msg = "你踏入了虚空。";
    showOverlay({
      kicker: st().name,
      title: "坠落",
      msg: msg,
      help: "Z 撤销上一步  ·  R 重来本关",
      actions: [
        { label: "撤销", fn: undo },
        { label: "重来", primary: true, fn: restart },
      ],
    });
  }

  function showClear() {
    if (S.stage >= STAGES.length - 1) {
      S.screen = "allclear";
      audio.all();
      confetti();
      showOverlay({
        kicker: "MIRROR STEP",
        title: "镜面尽头",
        msg: "十二次落脚，一次也没有踏空。<br />你与镜中的你始终同步。",
        help: "",
        actions: [{ label: "再走一遍", primary: true, fn: toTitle }],
      });
      return;
    }
    showOverlay({
      kicker: "关卡 " + (S.stage + 1),
      title: "同步",
      msg: "两人都站上了光点 · " + S.steps + " 步",
      help: "任意方向键继续",
      actions: [{ label: "下一关", primary: true, fn: nextStage }],
    });
  }

  function nextStage() {
    if (S.stage >= STAGES.length - 1) {
      toTitle();
      return;
    }
    loadStage(S.stage + 1);
    S.screen = "play";
    hideOverlay();
  }

  function restart() {
    loadStage(S.stage);
    S.screen = "play";
    hideOverlay();
  }

  function undo() {
    if (!S.undo.length) return;
    restore(S.undo.pop());
    syncHud();
  }

  function toTitle() {
    S.screen = "title";
    S.stage = 0;
    loadStage(0);
    showOverlay({
      kicker: "MIRROR STEP",
      title: "镜步",
      msg: "你走一步，镜中的你同步反步。<br />两人都必须落在实心砖上，一起站上光点。",
      help: "方向键 · WASD · 滑动 · 点邻格 · 屏幕十字",
      actions: [{ label: "踏入镜面", primary: true, fn: startGame }],
    });
  }

  function startGame() {
    audio.ensure();
    loadStage(0);
    S.screen = "play";
    hideOverlay();
    canvas.focus();
  }

  /* ---------- overlay ---------- */
  function showOverlay(opt) {
    ovKicker.textContent = opt.kicker;
    ovTitle.textContent = opt.title;
    ovMsg.innerHTML = opt.msg;
    ovHelp.textContent = opt.help || "";
    ovHelp.style.display = opt.help ? "" : "none";
    ovActions.innerHTML = "";
    (opt.actions || []).forEach(function (a) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = a.label;
      if (a.primary) b.className = "primary";
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        a.fn();
      });
      ovActions.appendChild(b);
    });
    overlay.classList.remove("hidden");
  }
  function hideOverlay() {
    overlay.classList.add("hidden");
  }

  /* ---------- particles ---------- */
  function cellCenter(x, y) {
    const pad = 18;
    const cell = (S.css - pad * 2) / N;
    return { x: pad + (x + 0.5) * cell, y: pad + (y + 0.5) * cell };
  }
  function spark(p, color, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 30 + Math.random() * 90;
      S.particles.push({
        x: p.x,
        y: p.y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 0.35 + Math.random() * 0.35,
        t: 0,
        color: color,
        r: 1.4 + Math.random() * 2.2,
      });
    }
  }
  function confetti() {
    for (let i = 0; i < 60; i++) {
      const p = {
        x: S.css * Math.random(),
        y: S.css * 0.15 * Math.random(),
        vx: (Math.random() - 0.5) * 80,
        vy: 40 + Math.random() * 80,
        life: 1.4 + Math.random(),
        t: 0,
        color: i % 3 === 0 ? GOLD : i % 3 === 1 ? PINK : CYAN,
        r: 1.6 + Math.random() * 2.4,
      };
      S.particles.push(p);
    }
  }
  function seedStars() {
    S.stars = [];
    for (let i = 0; i < 18; i++) {
      S.stars.push({
        x: Math.random() * N,
        y: Math.random() * N,
        p: Math.random() * Math.PI * 2,
        s: 0.6 + Math.random() * 1.2,
      });
    }
  }
  function tickParticles(dt) {
    for (let i = S.particles.length - 1; i >= 0; i--) {
      const p = S.particles[i];
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 40 * dt;
      if (p.t >= p.life) S.particles.splice(i, 1);
    }
  }

  /* ---------- render ---------- */
  const ctx = canvas.getContext("2d");

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const side = document.querySelector(".side");
    const landscape = window.innerWidth > 720;
    let maxW = window.innerWidth - 32;
    let maxH = window.innerHeight - 110;
    if (landscape) {
      maxW = Math.min(maxW - (side ? 200 : 0), maxH);
      maxH = maxW;
    } else {
      maxW = Math.min(maxW, maxH - 130);
      maxH = maxW;
    }
    const css = Math.max(240, Math.min(540, Math.floor(maxW)));
    S.css = css;
    canvas.style.width = css + "px";
    canvas.style.height = css + "px";
    canvas.width = Math.floor(css * dpr);
    canvas.height = Math.floor(css * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function ease(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function actorPos(which, tNow) {
    const cur = which === "you" ? S.you : S.mir;
    if (!S.anim) return { x: cur.x, y: cur.y, a: 1, sc: 1 };
    const from = which === "you" ? S.anim.fromY : S.anim.fromM;
    const to = which === "you" ? S.anim.toY : S.anim.toM;
    const wrapped = which === "you" ? S.anim.youWrap : S.anim.mirWrap;
    const u = ease(Math.min(1, S.anim.t / S.anim.dur));
    if (wrapped) {
      if (u < 0.5) {
        return { x: from.x, y: from.y, a: 1 - u * 2, sc: 1 - u };
      }
      return { x: to.x, y: to.y, a: (u - 0.5) * 2, sc: u };
    }
    return {
      x: lerp(from.x, to.x, u),
      y: lerp(from.y, to.y, u),
      a: 1,
      sc: 1,
    };
  }

  function draw() {
    const w = S.css;
    const pad = 18;
    const cell = (w - pad * 2) / N;
    const t = S.now;

    ctx.clearRect(0, 0, w, w);
    ctx.save();
    if (S.shake > 0) {
      ctx.translate((Math.random() - 0.5) * S.shake, (Math.random() - 0.5) * S.shake);
    }

    // board backdrop
    roundRect(ctx, 6, 6, w - 12, w - 12, 18);
    ctx.fillStyle = "#07050f";
    ctx.fill();

    // void stars
    S.stars.forEach(function (st) {
      const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 2.2 + st.p));
      ctx.globalAlpha = tw * 0.55;
      ctx.fillStyle = "#cfe";
      ctx.beginPath();
      ctx.arc(pad + st.x * cell, pad + st.y * cell, st.s, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    const s = st();

    // tiles
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const c = S.grid[y][x];
        const px = pad + x * cell;
        const py = pad + y * cell;
        const m = 3;
        if (c === ".") {
          // pit if next to floor
          let near = false;
          if (x > 0 && S.grid[y][x - 1] !== ".") near = true;
          if (x < N - 1 && S.grid[y][x + 1] !== ".") near = true;
          if (y > 0 && S.grid[y - 1][x] !== ".") near = true;
          if (y < N - 1 && S.grid[y + 1][x] !== ".") near = true;
          if (near) {
            roundRect(ctx, px + 8, py + 8, cell - 16, cell - 16, 8);
            ctx.fillStyle = "rgba(0,0,0,0.45)";
            ctx.fill();
          }
          continue;
        }
        roundRect(ctx, px + m, py + m, cell - m * 2, cell - m * 2, 10);
        const g = ctx.createLinearGradient(px, py, px, py + cell);
        g.addColorStop(0, "#1b1730");
        g.addColorStop(1, "#100e1c");
        ctx.fillStyle = g;
        ctx.fill();
        ctx.strokeStyle = "rgba(0,240,255,0.22)";
        ctx.lineWidth = 1;
        ctx.stroke();
        // sheen
        ctx.fillStyle = "rgba(255,255,255,0.04)";
        roundRect(ctx, px + m + 4, py + m + 3, cell - m * 2 - 8, (cell - m * 2) * 0.28, 6);
        ctx.fill();

        if (c === "*") {
          const pulse = 0.55 + 0.45 * Math.sin(t * 4 + x + y);
          const cx = px + cell / 2;
          const cy = py + cell / 2;
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(t * 0.8);
          ctx.strokeStyle = GOLD;
          ctx.globalAlpha = 0.35 + 0.45 * pulse;
          ctx.lineWidth = 2;
          ctx.strokeRect(-cell * 0.16, -cell * 0.16, cell * 0.32, cell * 0.32);
          ctx.rotate(Math.PI / 4);
          ctx.globalAlpha = 0.85;
          ctx.fillStyle = GOLD;
          ctx.beginPath();
          ctx.arc(0, 0, 4 + pulse * 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    }

    // axis
    ctx.save();
    ctx.translate(pad, pad);
    if (s.mode === "h" || s.mode === "p") {
      const ax = (N / 2) * cell;
      const grad = ctx.createLinearGradient(ax, 0, ax, N * cell);
      grad.addColorStop(0, "rgba(255,61,184,0)");
      grad.addColorStop(0.5, "rgba(255,61,184,0.55)");
      grad.addColorStop(1, "rgba(0,240,255,0)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 7]);
      ctx.beginPath();
      ctx.moveTo(ax, 6);
      ctx.lineTo(ax, N * cell - 6);
      ctx.stroke();
    }
    if (s.mode === "v" || s.mode === "p") {
      const ay = (N / 2) * cell;
      const grad = ctx.createLinearGradient(0, ay, N * cell, ay);
      grad.addColorStop(0, "rgba(0,240,255,0)");
      grad.addColorStop(0.5, "rgba(0,240,255,0.5)");
      grad.addColorStop(1, "rgba(255,61,184,0)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 7]);
      ctx.beginPath();
      ctx.moveTo(6, ay);
      ctx.lineTo(N * cell - 6, ay);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();

    // wrap ticks
    if (s.wrap) {
      ctx.fillStyle = "rgba(0,240,255,0.55)";
      function chev(x, y, ang) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(ang);
        ctx.beginPath();
        ctx.moveTo(0, -5);
        ctx.lineTo(4, 3);
        ctx.lineTo(-4, 3);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      chev(w / 2, 11, 0);
      chev(w / 2, w - 11, Math.PI);
      chev(11, w / 2, -Math.PI / 2);
      chev(w - 11, w / 2, Math.PI / 2);
    }

    // hover preview
    if (S.screen === "play" && S.hoverDir && !S.anim && !S.fall) {
      const d = DIRS[S.hoverDir];
      const md = mirrorDir(d.dx, d.dy, s.mode);
      const a = sample(S.you.x + d.dx, S.you.y + d.dy, s.wrap);
      const b = sample(S.mir.x + md.dx, S.mir.y + md.dy, s.wrap);
      drawGhost(a, cell, pad, PINK, a.ok);
      drawGhost(b, cell, pad, CYAN, b.ok);
    }

    const yp = actorPos("you");
    const mp = actorPos("mir");

    // link beam
    if (!S.fall) {
      const yc = {
        x: pad + (yp.x + 0.5) * cell,
        y: pad + (yp.y + 0.5) * cell,
      };
      const mc = {
        x: pad + (mp.x + 0.5) * cell,
        y: pad + (mp.y + 0.5) * cell,
      };
      const g = ctx.createLinearGradient(yc.x, yc.y, mc.x, mc.y);
      g.addColorStop(0, "rgba(255,61,184,0.45)");
      g.addColorStop(1, "rgba(0,240,255,0.45)");
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([]);
      ctx.globalAlpha = 0.55 * yp.a * mp.a;
      ctx.beginPath();
      ctx.moveTo(yc.x, yc.y);
      ctx.lineTo(mc.x, mc.y);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    const bob = Math.sin(t * 5) * 2.2;
    drawActor(yp, cell, pad, PINK, S.lastDir.you, bob, "you");
    drawActor(mp, cell, pad, CYAN, S.lastDir.mir, -bob, "mir");

    // particles
    S.particles.forEach(function (p) {
      const k = 1 - p.t / p.life;
      ctx.globalAlpha = k;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * k, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // win flash
    if (S.burst > 0) {
      ctx.fillStyle = "rgba(255,227,107," + (S.burst * 0.12) + ")";
      ctx.fillRect(0, 0, w, w);
    }

    ctx.restore();
  }

  function drawGhost(tile, cell, pad, color, ok) {
    if (tile.x < 0 || tile.y < 0 || tile.x >= N || tile.y >= N) return;
    const px = pad + tile.x * cell + cell / 2;
    const py = pad + tile.y * cell + cell / 2;
    ctx.beginPath();
    ctx.arc(px, py, cell * 0.18, 0, Math.PI * 2);
    ctx.strokeStyle = ok ? color : "#ff4d4d";
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }

  function drawActor(p, cell, pad, color, dir, bob, who) {
    let sc = p.sc;
    let a = p.a;
    let yOff = bob;
    if (S.fall) {
      const u = Math.min(1, S.fall.t / S.fall.dur);
      const doomed = (who === "you" && !S.fall.youOk) || (who === "mir" && !S.fall.mirOk);
      if (doomed) {
        sc *= 1 - u;
        a *= 1 - u;
        yOff += u * cell * 0.35;
      } else {
        a *= 1 - u * 0.35;
      }
    }
    const cx = pad + (p.x + 0.5) * cell;
    const cy = pad + (p.y + 0.5) * cell + yOff;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(sc, sc);
    ctx.globalAlpha = a;

    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, -cell * 0.08, cell * 0.13, 0, Math.PI * 2);
    ctx.fill();
    roundRect(ctx, -cell * 0.12, -cell * 0.02, cell * 0.24, cell * 0.28, 8);
    ctx.fill();

    // facing chevron
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#05030c";
    ctx.globalAlpha = a * 0.85;
    const ang = Math.atan2(dir.dy, dir.dx);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(cell * 0.1, 0);
    ctx.lineTo(cell * 0.02, -cell * 0.06);
    ctx.lineTo(cell * 0.02, cell * 0.06);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  function roundRect(c, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + rr, y);
    c.arcTo(x + w, y, x + w, y + h, rr);
    c.arcTo(x + w, y + h, x, y + h, rr);
    c.arcTo(x, y + h, x, y, rr);
    c.arcTo(x, y, x + w, y, rr);
    c.closePath();
  }

  /* ---------- loop ---------- */
  function frame(ts) {
    if (!S.t0) S.t0 = ts;
    const now = ts * 0.001;
    const dt = Math.min(0.05, now - (S.now || now));
    S.now = now;

    if (S.anim) {
      S.anim.t += dt;
      if (S.anim.t >= S.anim.dur) finishAnim();
    }
    if (S.fall) {
      S.fall.t += dt;
      if (S.fall.t >= S.fall.dur && S.screen === "dead" && overlay.classList.contains("hidden")) {
        showDeath();
      }
    }
    if (S.burst > 0) {
      S.burst -= dt;
      if (S.burst <= 0) {
        S.burst = 0;
        if (S.screen === "clear") showClear();
      }
    }
    if (S.shake > 0) S.shake = Math.max(0, S.shake - dt * 28);
    tickParticles(dt);
    draw();
    requestAnimationFrame(frame);
  }

  /* ---------- input ---------- */
  function onKey(e) {
    const k = e.key;
    if (k === "m" || k === "M") {
      e.preventDefault();
      toggleMute();
      return;
    }
    if (k === "z" || k === "Z" || k === "Backspace") {
      e.preventDefault();
      if (S.screen === "play" || S.screen === "dead") undo();
      return;
    }
    if (k === "r" || k === "R") {
      e.preventDefault();
      if (S.screen !== "title") restart();
      return;
    }
    if (k === "Enter" || k === " ") {
      e.preventDefault();
      if (S.screen === "title") startGame();
      else if (S.screen === "clear" && S.burst <= 0) nextStage();
      else if (S.screen === "dead") restart();
      else if (S.screen === "allclear") toTitle();
      return;
    }
    const map = {
      ArrowUp: "U",
      ArrowDown: "D",
      ArrowLeft: "L",
      ArrowRight: "R",
      w: "U",
      W: "U",
      s: "D",
      S: "D",
      a: "L",
      A: "L",
      d: "R",
      D: "R",
    };
    if (map[k]) {
      e.preventDefault();
      tryMove(map[k]);
    }
  }

  function toggleMute() {
    audio.muted = !audio.muted;
    S.muted = audio.muted;
    try {
      localStorage.setItem("mirror-step-mute", audio.muted ? "1" : "0");
    } catch (err) {}
    if (!audio.muted) audio.ensure();
    syncHud();
  }

  let ptr = null;
  canvas.addEventListener("pointerdown", function (e) {
    audio.ensure();
    canvas.setPointerCapture(e.pointerId);
    ptr = { x: e.clientX, y: e.clientY, t: S.now, moved: false };
  });
  canvas.addEventListener("pointermove", function (e) {
    if (!ptr) {
      hoverFromEvent(e);
      return;
    }
    const dx = e.clientX - ptr.x;
    const dy = e.clientY - ptr.y;
    if (Math.abs(dx) + Math.abs(dy) > 10) ptr.moved = true;
  });
  canvas.addEventListener("pointerup", function (e) {
    if (!ptr) return;
    const dx = e.clientX - ptr.x;
    const dy = e.clientY - ptr.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 28) {
      if (Math.abs(dx) > Math.abs(dy)) tryMove(dx > 0 ? "R" : "L");
      else tryMove(dy > 0 ? "D" : "U");
    } else if (!ptr.moved) {
      clickTile(e);
    }
    ptr = null;
  });
  canvas.addEventListener("pointercancel", function () {
    ptr = null;
  });
  canvas.addEventListener("pointerleave", function () {
    S.hoverDir = null;
  });

  function hoverFromEvent(e) {
    if (S.screen !== "play" || S.anim) return;
    const tile = eventTile(e);
    if (!tile) return;
    const dx = tile.x - S.you.x;
    const dy = tile.y - S.you.y;
    let dir = null;
    if (dx === 1 && dy === 0) dir = "R";
    else if (dx === -1 && dy === 0) dir = "L";
    else if (dx === 0 && dy === 1) dir = "D";
    else if (dx === 0 && dy === -1) dir = "U";
    else if (st().wrap) {
      if (S.you.x === 0 && tile.x === N - 1 && dy === 0) dir = "L";
      else if (S.you.x === N - 1 && tile.x === 0 && dy === 0) dir = "R";
      else if (S.you.y === 0 && tile.y === N - 1 && dx === 0) dir = "U";
      else if (S.you.y === N - 1 && tile.y === 0 && dx === 0) dir = "D";
    }
    S.hoverDir = dir;
  }

  function eventTile(e) {
    const r = canvas.getBoundingClientRect();
    const pad = 18;
    const cell = (S.css - pad * 2) / N;
    const x = ((e.clientX - r.left) * (S.css / r.width) - pad) / cell;
    const y = ((e.clientY - r.top) * (S.css / r.height) - pad) / cell;
    const tx = Math.floor(x);
    const ty = Math.floor(y);
    if (tx < 0 || ty < 0 || tx >= N || ty >= N) return null;
    return { x: tx, y: ty };
  }

  function clickTile(e) {
    const tile = eventTile(e);
    if (!tile) return;
    hoverFromEvent(e);
    if (S.hoverDir) tryMove(S.hoverDir);
  }

  document.getElementById("pad").addEventListener("pointerover", function (e) {
    const btn = e.target.closest("button");
    if (btn) S.hoverDir = btn.getAttribute("data-dir");
  });
  document.getElementById("pad").addEventListener("pointerdown", function (e) {
    const btn = e.target.closest("button");
    if (!btn) return;
    e.preventDefault();
    audio.ensure();
    S.hoverDir = btn.getAttribute("data-dir");
    tryMove(S.hoverDir);
  });
  document.getElementById("pad").addEventListener("pointerup", function () {
    S.hoverDir = null;
  });
  document.getElementById("pad").addEventListener("pointerleave", function () {
    S.hoverDir = null;
  });

  document.getElementById("btn-undo").addEventListener("click", function () {
    if (S.screen === "play" || S.screen === "dead") undo();
  });
  document.getElementById("btn-restart").addEventListener("click", restart);
  muteBtn.addEventListener("click", toggleMute);

  window.addEventListener("keydown", onKey);
  window.addEventListener("resize", resize);

  overlay.addEventListener("click", function (e) {
    if (e.target !== overlay) return;
    if (S.screen === "title") startGame();
  });

  /* ---------- boot ---------- */
  resize();
  loadStage(0);
  toTitle();
  requestAnimationFrame(frame);
})();
