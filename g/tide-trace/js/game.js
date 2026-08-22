(() => {
  "use strict";

  const PINK = "#ff3db8";
  const CYAN = "#00f0ff";
  const GOLD = "#ffe36b";
  const SPEED = 5.45;
  const RADIUS = 0.26;
  const STAGES = [
    {
      name: "浅滩",
      sub: "SHOAL",
      tide: 1.7,
      grace: 1.55,
      hint: "走向金色灯塔。脚印会变成潮水；海里也一样会吞人。",
      map: [
        "...~~........",
        "P............",
        "....##.......",
        ".............",
        "............X",
        "........##...",
        "~~..........."
      ]
    },
    {
      name: "礁盘",
      sub: "REEF",
      tide: 2.35,
      grace: 1.2,
      hint: "绕过礁石。别绕太远，也别停下来等潮。",
      map: [
        ".............",
        "P............",
        "...#######...",
        "...#######...",
        "...#######...",
        ".............",
        "............X"
      ]
    },
    {
      name: "折沟",
      sub: "BEND",
      tide: 3.35,
      grace: 0.95,
      hint: "只有一条沟。走到头再转弯，不要回头。",
      map: [
        "P............",
        "############.",
        ".............",
        ".############",
        "............X"
      ]
    },
    {
      name: "套湾",
      sub: "COVE",
      tide: 3.2,
      grace: 0.9,
      hint: "灯塔困在礁湾里。从缺口进去，别在湾里兜圈。",
      map: [
        ".............",
        "P............",
        "...#######...",
        "...#.....#...",
        "...#..X..#...",
        "...#.....#...",
        "...###.###...",
        "............."
      ]
    },
    {
      name: "裂池",
      sub: "RIFT",
      tide: 3.55,
      grace: 0.8,
      hint: "深池已经没过沙滩。贴着干岸走，别踩进水里。",
      map: [
        "P............",
        "...~~~~~.....",
        "...~~~~~.....",
        ".............",
        ".....~~~~....",
        ".....~~~~...X",
        "............."
      ]
    },
    {
      name: "回纹",
      sub: "TWIST",
      tide: 4.62,
      grace: 0.52,
      hint: "折返三次。保持速度，潮头就在脚后。",
      map: [
        "P............",
        "############.",
        ".............",
        ".############",
        ".............",
        "############.",
        "............X"
      ]
    },
    {
      name: "急潮",
      sub: "SURGE",
      tide: 4.5,
      grace: 0.52,
      hint: "潮更快了。绕过水裂与礁墙，找那条没被封死的岸。",
      map: [
        "P..~~.....#..",
        "...~~.....#..",
        ".##.......#..",
        ".##.#####.#..",
        "....#...#....",
        "~~..#......X.",
        "~~....#######"
      ]
    },
    {
      name: "灯塔",
      sub: "BEACON",
      tide: 4.95,
      grace: 0.34,
      hint: "四折长沟。潮头咬着脚后跟，不要停。",
      map: [
        "P............",
        "############.",
        ".............",
        ".############",
        ".............",
        "############.",
        ".............",
        ".############",
        "............X"
      ]
    },
    {
      name: "潮门",
      sub: "GATE",
      tide: 4.9,
      grace: 0.42,
      hint: "右侧窄缝才是路。左边空湾是假的，探进去就要折返。",
      map: [
        "P............",
        "########.#...",
        ".........#...",
        ".########.#..",
        "..........#..",
        "#########.#.#",
        "..........#..",
        ".##########.#",
        "..........#..",
        "###########.#",
        "............X"
      ]
    },
    {
      name: "潮缝",
      sub: "SEAM",
      tide: 5.0,
      grace: 0.35,
      hint: "外侧是海，内侧是礁。贴着礁石走，蹭到水就没顶。",
      map: [
        "P............",
        "~~~~####~~~~.",
        ".............",
        ".~~~~####~~~~",
        ".............",
        "~~~~####~~~~.",
        "............X"
      ]
    },
    {
      name: "怒潮",
      sub: "RAGE",
      tide: 5.05,
      grace: 0.26,
      hint: "六折长沟。贴着礁壁全速走，一停即没。",
      map: [
        "P............",
        "############.",
        ".............",
        ".############",
        ".............",
        "############.",
        ".............",
        ".############",
        ".............",
        "############.",
        ".............",
        ".############",
        "............X"
      ]
    },
    {
      name: "螺径",
      sub: "COIL",
      tide: 5.05,
      grace: 0.32,
      hint: "最后一岸。岸往里盘，别钻死环，停一秒就没顶。",
      map: [
        "P............",
        "############.",
        "#..........#.",
        "#.########.#.",
        "#.#......#.#.",
        "#.#.####.#.#.",
        "#.#.#..#.#.#.",
        "#.#.#X.#.#.#.",
        "#.#.#..#.#.#.",
        "#.#.#.#..#.#.",
        "#.#........#.",
        "#.########.#.",
        "#............"
      ]
    }
  ];

  function wrapOcean(lines) {
    const w = lines[0].length;
    const sea = "~".repeat(w + 2);
    return [sea].concat(lines.map((row) => "~" + row + "~"), [sea]);
  }

  function walkableChar(ch) {
    return ch !== "#" && ch !== "~";
  }

  function assertStages() {
    STAGES.forEach((stage, i) => {
      const w = stage.map[0].length;
      if (stage.map.some((row) => row.length !== w)) {
        throw new Error("map width " + stage.name);
      }
      const grid = wrapOcean(stage.map);
      let sc = -1;
      let sr = -1;
      let gc = -1;
      let gr = -1;
      for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
          const ch = grid[r][c];
          if (ch === "P") {
            sc = c;
            sr = r;
          }
          if (ch === "X") {
            gc = c;
            gr = r;
          }
        }
      }
      if (sc < 0 || gc < 0) throw new Error("spawn " + stage.name);
      const rows = grid.length;
      const cols = grid[0].length;
      const seen = new Uint8Array(rows * cols);
      const q = [sr * cols + sc];
      seen[sr * cols + sc] = 1;
      let found = false;
      let qi = 0;
      while (qi < q.length) {
        const id = q[qi++];
        const c = id % cols;
        const r = (id / cols) | 0;
        if (c === gc && r === gr) {
          found = true;
          break;
        }
        for (let d = 0; d < 4; d++) {
          let nc = c;
          let nr = r;
          if (d === 0) nc++;
          else if (d === 1) nc--;
          else if (d === 2) nr++;
          else nr--;
          if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
          const nid = nr * cols + nc;
          if (seen[nid]) continue;
          if (!walkableChar(grid[nr][nc])) continue;
          seen[nid] = 1;
          q.push(nid);
        }
      }
      if (!found) throw new Error("unsolvable " + i + " " + stage.name);
    });
  }

  assertStages();

  if (typeof document === "undefined") {
    console.log("tide-trace stages ok", STAGES.length);
    return;
  }

  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d", { alpha: false });
  const overlay = document.getElementById("overlay");
  const ovKicker = document.getElementById("ov-kicker");
  const ovTitle = document.getElementById("ov-title");
  const ovMsg = document.getElementById("ov-msg");
  const ovHelp = document.getElementById("ov-help");
  const ovActions = document.getElementById("ov-actions");
  const hintEl = document.getElementById("hint");
  const stageLabel = document.getElementById("stage-label");
  const nameLabel = document.getElementById("name-label");
  const tideFill = document.getElementById("tide-fill");
  const tideWrap = document.querySelector(".tide");
  const btnMute = document.getElementById("btn-mute");
  const btnRestart = document.getElementById("btn-restart");
  const pad = document.getElementById("pad");

  const keys = { U: false, D: false, L: false, R: false };
  const pointer = { down: false, x: 0, y: 0, id: null };

  let mode = "title";
  let stageIndex = 0;
  let cols = 1;
  let rows = 1;
  let grid = [];
  let flooded = [];
  let trail = [];
  let player = { x: 1.5, y: 1.5, vx: 0, vy: 0, facing: 0 };
  let beacon = { c: 1, r: 1 };
  let tide = 0;
  let moved = false;
  let graceLeft = 1;
  let tideSpeed = 1.7;
  let time = 0;
  let vis = { cell: 32, dpr: 1, cssW: 1, cssH: 1 };
  let particles = [];
  let foams = [];
  let shake = 0;
  let banner = { text: "", sub: "", t: 0 };
  let ending = null;
  let stepCool = 0;
  let floodCool = 0;
  let nearCool = 0;
  let lastT = 0;
  let primaryAction = null;
  let danger = 0;

  const SFX = {
    ctx: null,
    master: null,
    drone: null,
    droneGain: null,
    droneFilter: null,
    waves: null,
    muted: false,
    ensure() {
      if (this.ctx) {
        if (this.ctx.state === "suspended") this.ctx.resume();
        return;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.22;
      this.master.connect(this.ctx.destination);
      this._waves();
      this._drone();
    },
    _waves() {
      const ac = this.ctx;
      const len = ac.sampleRate * 2;
      const buf = ac.createBuffer(1, len, ac.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      const src = ac.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const f = ac.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 420;
      f.Q.value = 0.7;
      const g = ac.createGain();
      g.gain.value = 0.07;
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start();
      this.waves = { src, f, g };
    },
    _drone() {
      const ac = this.ctx;
      const o = ac.createOscillator();
      o.type = "sine";
      o.frequency.value = 46;
      const f = ac.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 180;
      const g = ac.createGain();
      g.gain.value = 0;
      o.connect(f);
      f.connect(g);
      g.connect(this.master);
      o.start();
      this.drone = o;
      this.droneGain = g;
      this.droneFilter = f;
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.22;
      btnMute.textContent = m ? "声关" : "声开";
      btnMute.setAttribute("aria-label", m ? "取消静音" : "静音");
      try {
        localStorage.setItem("tide-trace-mute", m ? "1" : "0");
      } catch (_) { /* ignore */ }
    },
    tone(freq, dur, type, vol, slide) {
      if (!this.ctx || this.muted) return;
      const ac = this.ctx;
      const t = ac.currentTime;
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = type || "sine";
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol || 0.08, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + dur + 0.02);
    },
    noise(dur, vol, freq) {
      if (!this.ctx || this.muted) return;
      const ac = this.ctx;
      const t = ac.currentTime;
      const len = Math.max(1, (ac.sampleRate * dur) | 0);
      const buf = ac.createBuffer(1, len, ac.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      const src = ac.createBufferSource();
      src.buffer = buf;
      const f = ac.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = freq || 800;
      const g = ac.createGain();
      g.gain.setValueAtTime(vol || 0.08, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
      src.stop(t + dur + 0.02);
    },
    step() {
      this.noise(0.05, 0.035, 1400);
      this.tone(220 + Math.random() * 40, 0.06, "triangle", 0.03);
    },
    flood() {
      this.noise(0.12, 0.05, 600);
      this.tone(180, 0.14, "sine", 0.04, 90);
    },
    win() {
      this.tone(523, 0.16, "sine", 0.08);
      this.tone(659, 0.2, "sine", 0.07);
      this.tone(784, 0.28, "triangle", 0.06);
      this.tone(1046, 0.4, "sine", 0.05);
    },
    lose() {
      this.noise(0.45, 0.1, 500);
      this.tone(220, 0.5, "sawtooth", 0.05, 70);
    },
    start() {
      this.tone(392, 0.1, "sine", 0.05);
      this.tone(523, 0.16, "sine", 0.04);
    },
    near() {
      this.tone(880, 0.08, "sine", 0.03);
    },
    tickDanger(amount) {
      if (!this.droneGain || !this.ctx) return;
      const t = this.ctx.currentTime;
      const g = this.muted ? 0 : amount * 0.07;
      this.droneGain.gain.setTargetAtTime(g, t, 0.08);
      if (this.drone) this.drone.frequency.setTargetAtTime(42 + amount * 90, t, 0.1);
    }
  };

  try {
    if (localStorage.getItem("tide-trace-mute") === "1") SFX.muted = true;
  } catch (_) { /* ignore */ }
  SFX.setMuted(SFX.muted);

  function hash(c, r, s) {
    let n = Math.imul(c + 1, 374761393) ^ Math.imul(r + 1, 668265263) ^ (s || 0);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }

  function inb(c, r) {
    return c >= 0 && r >= 0 && c < cols && r < rows;
  }

  function cellAt(x, y) {
    return { c: Math.floor(x), r: Math.floor(y) };
  }

  function isRock(c, r) {
    return !inb(c, r) || grid[r][c] === 1;
  }

  function isWater(c, r) {
    if (!inb(c, r)) return true;
    if (grid[r][c] === 2) return true;
    return flooded[r][c] === 1;
  }

  function isSand(c, r) {
    return inb(c, r) && grid[r][c] === 0 && flooded[r][c] !== 1;
  }

  function circleHitsRock(x, y, rad) {
    const c0 = Math.floor(x - rad);
    const c1 = Math.floor(x + rad);
    const r0 = Math.floor(y - rad);
    const r1 = Math.floor(y + rad);
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        if (!isRock(c, r)) continue;
        const nx = Math.max(c, Math.min(x, c + 1));
        const ny = Math.max(r, Math.min(y, r + 1));
        const dx = x - nx;
        const dy = y - ny;
        if (dx * dx + dy * dy < rad * rad) return true;
      }
    }
    return false;
  }

  function loadStage(i, playNow) {
    stageIndex = i;
    const spec = STAGES[i];
    const raw = wrapOcean(spec.map);
    rows = raw.length;
    cols = raw[0].length;
    grid = [];
    flooded = [];
    trail = [];
    particles = [];
    foams = [];
    beacon = { c: 1, r: 1 };
    let sc = 1;
    let sr = 1;
    for (let r = 0; r < rows; r++) {
      grid[r] = [];
      flooded[r] = [];
      for (let c = 0; c < cols; c++) {
        const ch = raw[r][c];
        flooded[r][c] = 0;
        if (ch === "#") grid[r][c] = 1;
        else if (ch === "~") grid[r][c] = 2;
        else grid[r][c] = 0;
        if (ch === "P") {
          sc = c;
          sr = r;
        }
        if (ch === "X") {
          beacon.c = c;
          beacon.r = r;
        }
      }
    }
    player.x = sc + 0.5;
    player.y = sr + 0.5;
    player.vx = 0;
    player.vy = 0;
    player.facing = 0;
    trail.push({ c: sc, r: sr });
    tide = 0;
    moved = false;
    graceLeft = spec.grace;
    tideSpeed = spec.tide;
    ending = null;
    shake = 0;
    danger = 0;
    banner.text = spec.name;
    banner.sub = spec.sub;
    banner.t = 0;
    hintEl.textContent = spec.hint;
    hintEl.classList.remove("warn");
    stageLabel.textContent = "关卡 " + (i + 1) + " / " + STAGES.length;
    nameLabel.textContent = spec.name;
    layout();
    seedFoam();
    if (playNow) {
      mode = "play";
      hideOverlay();
    }
    renderHud();
  }

  function seedFoam() {
    foams = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] !== 2) continue;
        const n = 1 + (hash(c, r, 9) * 2) | 0;
        for (let k = 0; k < n; k++) {
          foams.push({
            c,
            r,
            u: hash(c, r, 11 + k),
            v: hash(c, r, 27 + k),
            s: 0.4 + hash(c, r, 41 + k) * 0.8,
            p: hash(c, r, 53 + k) * Math.PI * 2
          });
        }
      }
    }
  }

  function layout() {
    const play = document.querySelector(".play");
    const side = document.querySelector(".side");
    const pr = play.getBoundingClientRect();
    const mobile = window.innerWidth <= 720;
    let w = pr.width;
    let h = pr.height;
    if (mobile) {
      h = Math.max(180, pr.height - side.offsetHeight - 8);
    } else {
      w = Math.max(240, pr.width - side.offsetWidth - 22);
    }
    w = Math.max(260, w);
    h = Math.max(180, h);
    const cellFit = Math.min(w / cols, h / rows);
    vis.cssW = Math.max(1, Math.floor(cellFit * cols));
    vis.cssH = Math.max(1, Math.floor(cellFit * rows));
    vis.dpr = Math.min(2, window.devicePixelRatio || 1);
    vis.cell = vis.cssW / cols;
    canvas.width = Math.floor(vis.cssW * vis.dpr);
    canvas.height = Math.floor(vis.cssH * vis.dpr);
    canvas.style.width = vis.cssW + "px";
    canvas.style.height = vis.cssH + "px";
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
    overlay.classList.remove("win", "lose");
    overlay.setAttribute("aria-hidden", "true");
    canvas.focus();
  }

  function showOverlay(kind) {
    overlay.classList.remove("hidden", "win", "lose");
    overlay.setAttribute("aria-hidden", "false");
    mode = kind === "title" ? "title" : kind;
    if (kind === "win" || kind === "clear") overlay.classList.add("win");
    if (kind === "dead") overlay.classList.add("lose");
    ovActions.innerHTML = "";
    primaryAction = null;

    const add = (label, fn, primary) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      if (primary) b.className = "primary";
      b.addEventListener("click", fn);
      ovActions.appendChild(b);
      if (primary) primaryAction = fn;
    };

    if (kind === "title") {
      ovKicker.textContent = "TIDE";
      ovTitle.textContent = "潮痕";
      ovMsg.innerHTML = "十二岸灯塔。先画出通往灯塔的路。<br />潮水会顺着脚印涌来，吞掉你走过的岸。";
      ovHelp.textContent = "拖拽绘制 · WASD / 方向键 · 屏幕十字 · M 静音";
      add("踏潮", startRun, true);
    } else if (kind === "dead") {
      ovKicker.textContent = STAGES[stageIndex].sub;
      ovTitle.textContent = "没入潮中";
      ovMsg.innerHTML = "潮水吞掉了你走过的岸。<br />停得太久，或踩进了水里。";
      ovHelp.textContent = "R 重来 · 空格再走一次";
      add("再走一次", () => beginStage(stageIndex), true);
      add("重开本局", () => beginStage(0), false);
    } else if (kind === "win") {
      ovKicker.textContent = STAGES[stageIndex].sub;
      ovTitle.textContent = "靠岸";
      ovMsg.innerHTML = "灯塔还在。下一岸潮更快。<br />" + (stageIndex + 1) + " / " + STAGES.length;
      ovHelp.textContent = "空格下一岸 · R 重走本关";
      add("下一岸", () => beginStage(stageIndex + 1), true);
      add("重走本关", () => beginStage(stageIndex), false);
    } else if (kind === "clear") {
      ovKicker.textContent = "TIDE";
      ovTitle.textContent = "潮退了";
      ovMsg.innerHTML = "十二岸灯火都还亮着。<br />潮痕退回海里，沙滩又干了。";
      ovHelp.textContent = "空格再来一局";
      add("再来一局", () => beginStage(0), true);
    }
  }

  function startRun() {
    SFX.ensure();
    SFX.start();
    beginStage(0);
  }

  function beginStage(i) {
    SFX.ensure();
    loadStage(i, true);
    SFX.start();
  }

  function burst(x, y, n, rgb, spd, life) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = spd * (0.3 + Math.random());
      particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        t: 0,
        life: life * (0.6 + Math.random() * 0.6),
        rgb,
        r: 0.04 + Math.random() * 0.07
      });
    }
  }

  function floodCell(c, r) {
    if (!inb(c, r) || flooded[r][c] === 1) return;
    if (grid[r][c] === 1) return;
    flooded[r][c] = 1;
    burst(c + 0.5, r + 0.5, 7, "0,240,255", 1.6, 0.45);
    burst(c + 0.5, r + 0.5, 4, "255,61,184", 1.1, 0.4);
    if (floodCool <= 0) {
      SFX.flood();
      floodCool = 0.08;
    }
  }

  function finish(kind) {
    if (ending) return;
    ending = { kind, t: 0 };
    mode = "ending";
    if (kind === "dead") {
      SFX.lose();
      shake = 7;
      burst(player.x, player.y, 22, "0,240,255", 2.8, 0.7);
      burst(player.x, player.y, 14, "255,61,184", 2.2, 0.65);
    } else {
      SFX.win();
      burst(beacon.c + 0.5, beacon.r + 0.5, 24, "255,227,107", 2.4, 0.9);
      burst(player.x, player.y, 10, "0,240,255", 1.6, 0.5);
    }
  }

  function inputVector() {
    let ix = 0;
    let iy = 0;
    if (keys.L) ix -= 1;
    if (keys.R) ix += 1;
    if (keys.U) iy -= 1;
    if (keys.D) iy += 1;
    if (pointer.down) {
      const dx = pointer.x - player.x;
      const dy = pointer.y - player.y;
      const d = Math.hypot(dx, dy);
      if (d > 0.08) {
        ix = dx / d;
        iy = dy / d;
      } else {
        ix = 0;
        iy = 0;
      }
    } else if (ix || iy) {
      const d = Math.hypot(ix, iy);
      ix /= d;
      iy /= d;
    }
    return { ix, iy };
  }

  function tryMove(nx, ny) {
    if (!circleHitsRock(nx, ny, RADIUS)) return { x: nx, y: ny };
    if (!circleHitsRock(nx, player.y, RADIUS)) return { x: nx, y: player.y };
    if (!circleHitsRock(player.x, ny, RADIUS)) return { x: player.x, y: ny };
    return { x: player.x, y: player.y };
  }

  function update(dt) {
    time += dt;
    banner.t += dt;
    stepCool -= dt;
    floodCool -= dt;
    nearCool -= dt;
    shake = Math.max(0, shake - dt * 18);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
      if (p.t >= p.life) particles.splice(i, 1);
    }

    if (mode === "title") {
      SFX.tickDanger(0);
      return;
    }

    if (ending) {
      ending.t += dt;
      SFX.tickDanger(ending.kind === "dead" ? 0.8 : 0);
      if (ending.t > 0.62 && mode === "ending") {
        if (ending.kind === "dead") showOverlay("dead");
        else if (stageIndex >= STAGES.length - 1) showOverlay("clear");
        else showOverlay("win");
      }
      return;
    }

    if (mode !== "play") {
      SFX.tickDanger(0);
      return;
    }

    const { ix, iy } = inputVector();
    const sp = SPEED * (pointer.down ? 1.05 : 1);
    const ox = player.x;
    const oy = player.y;
    const pos = tryMove(player.x + ix * sp * dt, player.y + iy * sp * dt);
    player.x = pos.x;
    player.y = pos.y;
    if (ix || iy) {
      player.facing = Math.atan2(iy, ix);
      player.vx = ix;
      player.vy = iy;
    } else {
      player.vx *= 0.7;
      player.vy *= 0.7;
    }
    if (Math.hypot(player.x - ox, player.y - oy) > 0.0008) moved = true;

    const cc = cellAt(player.x, player.y);
    if (isWater(cc.c, cc.r)) {
      finish("dead");
      return;
    }

    const last = trail[trail.length - 1];
    if (last.c !== cc.c || last.r !== cc.r) {
      if (isSand(cc.c, cc.r) || (cc.c === beacon.c && cc.r === beacon.r)) {
        trail.push({ c: cc.c, r: cc.r });
        if (stepCool <= 0) {
          SFX.step();
          stepCool = 0.07;
        }
        burst(player.x, player.y, 2, "255,61,184", 0.6, 0.28);
      }
    }

    const bdx = player.x - (beacon.c + 0.5);
    const bdy = player.y - (beacon.r + 0.5);
    if (bdx * bdx + bdy * bdy < 0.18) {
      finish("win");
      return;
    }
    if (bdx * bdx + bdy * bdy < 1.6 && nearCool <= 0) {
      SFX.near();
      nearCool = 0.9;
    }

    if (moved) graceLeft -= dt;
    const prevTide = tide;
    if (moved && graceLeft <= 0) {
      tide += dt * tideSpeed;
    }
    const maxFlood = Math.min(trail.length, Math.floor(tide));
    const prevFlood = Math.min(trail.length, Math.floor(prevTide));
    for (let i = prevFlood; i < maxFlood; i++) {
      floodCell(trail[i].c, trail[i].r);
    }

    const here = trail.length - 1;
    const gap = here - tide;
    if (tide >= here + 0.62 && moved && graceLeft <= 0) {
      floodCell(cc.c, cc.r);
      finish("dead");
      return;
    }

    danger = moved && graceLeft <= 0 ? 1 - Math.max(0, Math.min(1, gap / 6)) : 0;
    SFX.tickDanger(danger);
    if (danger > 0.62) {
      hintEl.textContent = "潮水近了";
      hintEl.classList.add("warn");
    } else {
      hintEl.textContent = STAGES[stageIndex].hint;
      hintEl.classList.remove("warn");
    }
    renderHud();
  }

  function renderHud() {
    const here = Math.max(0, trail.length - 1);
    const gap = moved && graceLeft <= 0 ? here - tide : 8;
    const pct = Math.max(0, Math.min(1, gap / 8));
    tideFill.style.transform = "scaleX(" + pct.toFixed(3) + ")";
    tideWrap.classList.toggle("hot", pct < 0.34 && mode === "play");
  }

  function draw() {
    const dpr = vis.dpr;
    const cell = vis.cell;
    const w = vis.cssW;
    const h = vis.cssH;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sx = (Math.random() - 0.5) * shake * 0.6;
    const sy = (Math.random() - 0.5) * shake * 0.6;
    ctx.translate(sx, sy);

    ctx.fillStyle = "#04010a";
    ctx.fillRect(-4, -4, w + 8, h + 8);

    const gbg = ctx.createRadialGradient(w * 0.5, h * 0.15, 10, w * 0.5, h * 0.5, w * 0.75);
    gbg.addColorStop(0, "rgba(255, 61, 184, 0.08)");
    gbg.addColorStop(0.45, "rgba(0, 240, 255, 0.05)");
    gbg.addColorStop(1, "rgba(5, 3, 12, 0)");
    ctx.fillStyle = gbg;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 5; i++) {
      const yy = ((time * 12 + i * 28) % (h + 40)) - 20;
      ctx.strokeStyle = "rgba(0, 240, 255, " + (0.03 + i * 0.01) + ")";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 8) {
        const y = yy + Math.sin(x * 0.03 + time * 1.4 + i) * 6;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    const fillHead = tide - Math.floor(tide);
    const headIndex = Math.floor(tide);
    const wetSet = new Set();
    for (let i = Math.max(0, headIndex); i < trail.length; i++) {
      wetSet.add(trail[i].c + "," + trail[i].r);
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * cell;
        const y = r * cell;
        const tcell = grid[r][c];
        if (tcell === 2 || flooded[r][c] === 1) {
          drawWater(x, y, cell, c, r, 1);
        } else if (tcell === 1) {
          drawRock(x, y, cell, c, r);
        } else {
          drawSand(x, y, cell, c, r, wetSet.has(c + "," + r));
        }
      }
    }

    if (mode !== "title" && trail.length) {
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.strokeStyle = "rgba(255, 61, 184, 0.55)";
      ctx.lineWidth = Math.max(2, cell * 0.18);
      ctx.beginPath();
      for (let i = 0; i < trail.length; i++) {
        if (i < headIndex) continue;
        const p = trail[i];
        const px = (p.c + 0.5) * cell;
        const py = (p.r + 0.5) * cell;
        if (i === 0 || i === headIndex) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.strokeStyle = "rgba(0, 240, 255, 0.35)";
      ctx.lineWidth = Math.max(1.2, cell * 0.08);
      ctx.stroke();
    }

    if (moved && graceLeft <= 0 && headIndex >= 0 && headIndex < trail.length) {
      const hd = trail[headIndex];
      const prev = trail[Math.max(0, headIndex - 1)];
      drawWaterFill(hd.c, hd.r, fillHead, prev.c, prev.r, cell);
    }

    for (let i = 0; i < foams.length; i++) {
      const f = foams[i];
      const wob = Math.sin(time * 2.2 + f.p) * 0.12;
      const x = (f.c + f.u * 0.8 + 0.1) * cell;
      const y = (f.r + f.v * 0.8 + 0.1 + wob * 0.15) * cell;
      ctx.fillStyle = "rgba(255, 255, 255, " + (0.14 + 0.1 * Math.sin(time * 3 + f.p)) + ")";
      ctx.beginPath();
      ctx.ellipse(x, y, cell * 0.08 * f.s, cell * 0.045 * f.s, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    drawBeacon(cell);
    drawPlayer(cell);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = 1 - p.t / p.life;
      ctx.fillStyle = "rgba(" + p.rgb + "," + (a * 0.9) + ")";
      ctx.beginPath();
      ctx.arc(p.x * cell, p.y * cell, p.r * cell, 0, Math.PI * 2);
      ctx.fill();
    }

    const vg = ctx.createRadialGradient(w * 0.5, h * 0.5, w * 0.28, w * 0.5, h * 0.5, w * 0.72);
    vg.addColorStop(0, "rgba(5,3,12,0)");
    vg.addColorStop(1, "rgba(5,3,12," + (0.34 + danger * 0.22) + ")");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);

    if (danger > 0.55 && mode === "play") {
      ctx.fillStyle = "rgba(255, 61, 184, " + ((danger - 0.55) * 0.18) + ")";
      ctx.fillRect(0, 0, w, h);
    }

    if (banner.t < 1.8 && mode === "play") {
      const a = banner.t < 0.25 ? banner.t / 0.25 : banner.t > 1.3 ? (1.8 - banner.t) / 0.5 : 1;
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(246, 243, 255, " + a + ")";
      ctx.font = "700 " + Math.floor(cell * 0.62) + "px 'Segoe UI', 'PingFang SC', sans-serif";
      ctx.fillText(banner.text, w / 2, h * 0.18);
      ctx.fillStyle = "rgba(0, 240, 255, " + a * 0.85 + ")";
      ctx.font = "600 " + Math.floor(cell * 0.28) + "px 'Segoe UI', sans-serif";
      ctx.fillText(banner.sub, w / 2, h * 0.18 + cell * 0.42);
    }
  }

  function drawSand(x, y, cell, c, r, wet) {
    const n = hash(c, r, 3);
    const nearSea = neighborWater(c, r);
    const base = wet ? 18 + n * 10 : 22 + n * 14;
    ctx.fillStyle = "rgb(" + (base + (wet ? 8 : 0)) + "," + (base - 6) + "," + (base + 18 + nearSea * 16) + ")";
    ctx.fillRect(x, y, cell + 0.5, cell + 0.5);
    if (wet) {
      ctx.fillStyle = "rgba(255, 61, 184, 0.16)";
      ctx.fillRect(x, y, cell + 0.5, cell + 0.5);
      ctx.fillStyle = "rgba(0, 240, 255, 0.08)";
      ctx.fillRect(x, y, cell + 0.5, cell + 0.5);
    }
    for (let k = 0; k < 5; k++) {
      const gx = x + hash(c, r, 20 + k) * cell;
      const gy = y + hash(c, r, 40 + k) * cell;
      ctx.fillStyle = "rgba(255,255,255," + (0.03 + hash(c, r, 60 + k) * 0.05) + ")";
      ctx.fillRect(gx, gy, 1.2, 1.2);
    }
  }

  function neighborWater(c, r) {
    let n = 0;
    if (isWater(c + 1, r)) n++;
    if (isWater(c - 1, r)) n++;
    if (isWater(c, r + 1)) n++;
    if (isWater(c, r - 1)) n++;
    return n / 4;
  }

  function drawRock(x, y, cell, c, r) {
    const n = hash(c, r, 2);
    ctx.fillStyle = "rgb(" + (14 + n * 10) + "," + (12 + n * 8) + "," + (22 + n * 16) + ")";
    ctx.fillRect(x, y, cell + 0.5, cell + 0.5);
    ctx.fillStyle = "rgba(0, 240, 255, 0.12)";
    ctx.fillRect(x + 1, y + 1, cell * 0.35, cell * 0.18);
    ctx.strokeStyle = "rgba(255, 61, 184, 0.18)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1);
    const rim = neighborWater(c, r);
    if (rim > 0) {
      ctx.fillStyle = "rgba(0, 240, 255, " + (0.08 + rim * 0.2) + ")";
      ctx.fillRect(x, y + cell * 0.72, cell, cell * 0.28);
    }
  }

  function drawWater(x, y, cell, c, r, alpha) {
    const wave = 0.5 + 0.5 * Math.sin(c * 0.9 + r * 0.55 + time * 2.4);
    const wave2 = 0.5 + 0.5 * Math.sin(c * 0.4 - r * 0.8 + time * 1.6);
    const cr = 4 + wave * 12;
    const cg = 18 + wave2 * 40;
    const cb = 38 + wave * 50;
    ctx.fillStyle = "rgba(" + cr + "," + cg + "," + cb + "," + alpha + ")";
    ctx.fillRect(x, y, cell + 0.5, cell + 0.5);
    ctx.fillStyle = "rgba(0, 240, 255, " + (0.07 + wave * 0.1) * alpha + ")";
    ctx.fillRect(x, y + cell * (0.35 + wave * 0.2), cell, cell * 0.12);
    ctx.fillStyle = "rgba(255, 61, 184, " + (0.05 + wave2 * 0.08) * alpha + ")";
    ctx.fillRect(x, y + cell * (0.15 + wave2 * 0.25), cell, cell * 0.07);
    if (isSand(c, r - 1) || (inb(c, r - 1) && grid[r - 1][c] === 1)) {
      ctx.fillStyle = "rgba(246, 243, 255, " + (0.18 + wave * 0.12) + ")";
      ctx.fillRect(x, y, cell, Math.max(1.5, cell * 0.08));
    }
  }

  function drawWaterFill(c, r, frac, fromC, fromR, cell) {
    const x = c * cell;
    const y = r * cell;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, cell + 0.5, cell + 0.5);
    ctx.clip();
    let wx = x;
    let wy = y;
    let ww = cell;
    let wh = cell;
    if (fromC < c) {
      ww = cell * frac;
    } else if (fromC > c) {
      ww = cell * frac;
      wx = x + cell - ww;
    } else if (fromR < r) {
      wh = cell * frac;
    } else if (fromR > r) {
      wh = cell * frac;
      wy = y + cell - wh;
    } else {
      const m = (1 - frac) * 0.5;
      wx = x + cell * m;
      wy = y + cell * m;
      ww = cell * frac;
      wh = cell * frac;
    }
    drawWater(wx, wy, Math.max(ww, wh), c, r, 1);
    ctx.fillStyle = "rgba(246,243,255,0.45)";
    ctx.fillRect(wx, wy, ww, 2);
    ctx.fillStyle = "rgba(255,61,184,0.35)";
    ctx.fillRect(wx + ww - 2, wy, 2, wh);
    ctx.restore();
    ctx.strokeStyle = "rgba(0, 240, 255, 0.7)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, cell - 2, cell - 2);
  }

  function drawBeacon(cell) {
    const cx = (beacon.c + 0.5) * cell;
    const cy = (beacon.r + 0.5) * cell;
    const ang = time * 0.85;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ang);
    const beam = ctx.createLinearGradient(0, 0, cell * 6, 0);
    beam.addColorStop(0, "rgba(255, 227, 107, 0.28)");
    beam.addColorStop(1, "rgba(255, 227, 107, 0)");
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(cell * 6, -cell * 0.9);
    ctx.lineTo(cell * 6, cell * 0.9);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = "rgba(255, 227, 107, 0.12)";
    ctx.beginPath();
    ctx.arc(cx, cy, cell * (0.55 + Math.sin(time * 3) * 0.05), 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#1a1424";
    ctx.fillRect(cx - cell * 0.12, cy - cell * 0.18, cell * 0.24, cell * 0.42);
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.arc(cx, cy - cell * 0.22, cell * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff6c4";
    ctx.beginPath();
    ctx.arc(cx - cell * 0.04, cy - cell * 0.26, cell * 0.06, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawPlayer(cell) {
    const px = player.x * cell;
    const py = player.y * cell;
    const pulse = 0.5 + 0.5 * Math.sin(time * 6);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(player.facing);
    ctx.fillStyle = "rgba(255, 61, 184, " + (0.18 + pulse * 0.1) + ")";
    ctx.beginPath();
    ctx.ellipse(-cell * 0.08, 0, cell * 0.38, cell * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = CYAN;
    ctx.beginPath();
    ctx.arc(0, 0, cell * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PINK;
    ctx.beginPath();
    ctx.arc(cell * 0.02, 0, cell * 0.11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(-cell * 0.05, -cell * 0.05, cell * 0.045, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = "rgba(0, 240, 255, 0.35)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(px, py, cell * (0.32 + pulse * 0.04), 0, Math.PI * 2);
    ctx.stroke();
  }

  function clientToWorld(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * cols;
    const y = (e.clientY - rect.top) / rect.height * rows;
    return { x, y };
  }

  function onPointerDown(e) {
    if (mode !== "play") return;
    if (e.target !== canvas) return;
    SFX.ensure();
    pointer.down = true;
    pointer.id = e.pointerId;
    const wpos = clientToWorld(e);
    pointer.x = wpos.x;
    pointer.y = wpos.y;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (_) { /* ignore */ }
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!pointer.down || (pointer.id !== null && e.pointerId !== pointer.id)) return;
    const wpos = clientToWorld(e);
    pointer.x = wpos.x;
    pointer.y = wpos.y;
    e.preventDefault();
  }

  function onPointerUp(e) {
    if (pointer.id !== null && e.pointerId !== pointer.id) return;
    pointer.down = false;
    pointer.id = null;
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  function setDir(dir, on) {
    if (dir) keys[dir] = on;
  }

  pad.addEventListener("pointerdown", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    SFX.ensure();
    setDir(btn.getAttribute("data-dir"), true);
    btn.classList.add("held");
    try { btn.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
    e.preventDefault();
  });
  pad.addEventListener("pointerup", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    setDir(btn.getAttribute("data-dir"), false);
    btn.classList.remove("held");
  });
  pad.addEventListener("pointercancel", () => {
    keys.U = keys.D = keys.L = keys.R = false;
    pad.querySelectorAll("button").forEach((b) => b.classList.remove("held"));
  });

  const KEYMAP = {
    ArrowUp: "U", w: "U", W: "U",
    ArrowDown: "D", s: "D", S: "D",
    ArrowLeft: "L", a: "L", A: "L",
    ArrowRight: "R", d: "R", D: "R"
  };

  window.addEventListener("keydown", (e) => {
    if (e.repeat && KEYMAP[e.key]) {
      e.preventDefault();
      return;
    }
    if (e.key === "m" || e.key === "M") {
      SFX.ensure();
      SFX.setMuted(!SFX.muted);
      e.preventDefault();
      return;
    }
    if (e.key === "r" || e.key === "R") {
      SFX.ensure();
      if (mode === "title") startRun();
      else beginStage(stageIndex);
      e.preventDefault();
      return;
    }
    if (e.key === " " || e.key === "Enter") {
      if (!overlay.classList.contains("hidden") && primaryAction) {
        primaryAction();
        e.preventDefault();
        return;
      }
    }
    const dir = KEYMAP[e.key];
    if (dir) {
      keys[dir] = true;
      SFX.ensure();
      e.preventDefault();
    }
  });
  window.addEventListener("keyup", (e) => {
    const dir = KEYMAP[e.key];
    if (dir) keys[dir] = false;
  });
  window.addEventListener("blur", () => {
    keys.U = keys.D = keys.L = keys.R = false;
    pointer.down = false;
  });

  btnMute.addEventListener("click", () => {
    SFX.ensure();
    SFX.setMuted(!SFX.muted);
  });
  btnRestart.addEventListener("click", () => {
    SFX.ensure();
    if (mode === "title") startRun();
    else beginStage(stageIndex);
  });

  window.addEventListener("resize", layout);

  function loop(ts) {
    if (!lastT) lastT = ts;
    let dt = (ts - lastT) / 1000;
    lastT = ts;
    if (dt > 0.05) dt = 0.05;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  loadStage(0, false);
  showOverlay("title");
  requestAnimationFrame(loop);
})();
