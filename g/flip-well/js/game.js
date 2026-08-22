(() => {
  "use strict";

  const TILE = 32;
  const COLS = 13;
  const PR = 10;
  const GRAV_ACC = 1680;
  const MAX_V = 700;
  const COOL_T = 0.9;
  const MOVE = 248;
  const ACCEL_G = 1900;
  const ACCEL_A = 1250;
  const FRICTION = 2400;
  const AIR_DRAG = 0.55;
  const FLIP_KICK = 110;
  const FLIP_BUF = 0.14;
  const EXIT_R = 26;
  const DIE_T = 0.5;
  const CLEAR_T = 0.62;

  const MAG = "#ff3db8";
  const CYAN = "#00f0ff";
  const GOLD = "#ffe36b";

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function apad(inner) {
    const s = "#" + inner + "#";
    if (s.length !== COLS) throw new Error("row " + s.length + " " + inner);
    return s;
  }
  const W = "#".repeat(COLS);
  const E = ".".repeat(11);
  const SU = "^".repeat(11);
  const SD = "v".repeat(11);

  const STAGES = [
    {
      name: "初翻",
      sub: "FIRST",
      hint: "冷却满了再翻。贴着台面落到井的另一头。",
      map: [
        W,
        apad(SD),
        apad(E),
        apad("...=====..."),
        apad(".....X....."),
        apad(E),
        apad(E),
        apad(".....P....."),
        apad("=".repeat(11)),
        apad(E),
        apad(E),
        apad(E),
        apad(SU),
        W
      ]
    },
    {
      name: "落井",
      sub: "DROP",
      hint: "先走下井，落地后再翻上去。",
      map: [
        W,
        apad(SD),
        apad(E),
        apad("======....."),
        apad("X.........."),
        apad(E),
        apad(E),
        apad(".........P."),
        apad(".......===="),
        apad(E),
        apad(E),
        apad(E),
        apad(E),
        apad("======....."),
        apad(E),
        apad(E),
        apad(SU),
        W
      ]
    },
    {
      name: "偏台",
      sub: "SHIFT",
      hint: "在空中平移。翻早了会撞上刺顶。",
      map: [
        W,
        apad(SD),
        apad(E),
        apad(".......===="),
        apad(".........X."),
        apad(E),
        apad(E),
        apad("P.........."),
        apad("====......."),
        apad(E),
        apad(E),
        apad(E),
        apad(E),
        apad(E),
        apad(E),
        apad(SU),
        W
      ]
    },
    {
      name: "算距",
      sub: "RANGE",
      hint: "等一等再翻。翻晚了刹不住，会扎进井底。",
      map: [
        W,
        apad(SD),
        apad(E),
        apad("====......."),
        apad("X.........."),
        apad(E),
        apad(E),
        apad(".........P."),
        apad(".......===="),
        apad(E),
        apad(E),
        apad(E),
        apad(E),
        apad(E),
        apad(E),
        apad(E),
        apad(E),
        apad(SU),
        W
      ]
    },
    {
      name: "刺面",
      sub: "THORN",
      hint: "台面朝上长刺。从下面贴上去。",
      map: [
        W,
        apad(SD),
        apad(E),
        apad("........^^^"),
        apad("........==="),
        apad(".........X."),
        apad(E),
        apad(E),
        apad("P.........."),
        apad("====......."),
        apad(E),
        apad(E),
        apad(E),
        apad(E),
        apad(E),
        apad(SU),
        W
      ]
    },
    {
      name: "三翻",
      sub: "TRI",
      hint: "先贴下沿，等冷却，再翻到更高的台面上。",
      map: [
        W,
        apad(SD),
        apad(E),
        apad(E),
        apad(E),
        apad(E),
        apad(E),
        apad(E),
        apad("========..."),
        apad("..X........"),
        apad(E),
        apad(E),
        apad("........==="),
        apad(E),
        apad(E),
        apad(E),
        apad(".........P."),
        apad("........==="),
        apad(E),
        apad(E),
        apad(SU),
        W
      ]
    },
    {
      name: "井口",
      sub: "MOUTH",
      hint: "先落到井底，别翻到刺台上。再翻回井口。",
      map: [
        W,
        apad(SD),
        apad(E),
        apad("======....."),
        apad("X.........."),
        apad(E),
        apad(E),
        apad("........^^^"),
        apad("........==="),
        apad(E),
        apad(".........P."),
        apad(".......===="),
        apad(E),
        apad(E),
        apad(E),
        apad(E),
        apad("======....."),
        apad(E),
        apad(E),
        apad(SU),
        W
      ]
    },
    {
      name: "窄台",
      sub: "LEDGE",
      hint: "台面只有两格。空中平移，贴着窄沿翻上去。",
      map: [
        W,
        apad(SD),
        apad(E),
        apad(".........=="),
        apad("..........X"),
        apad(E),
        apad(E),
        apad(E),
        apad(E),
        apad(E),
        apad(E),
        apad("P.........."),
        apad("===........"),
        apad(E),
        apad(E),
        apad(E),
        apad(E),
        apad(SU),
        W
      ]
    },
    {
      name: "假台",
      sub: "FAKE",
      hint: "头上那块台两面都是刺。先走到空处，再翻到左边的真沿。",
      map: [
        W,
        apad(SD),
        apad(E),
        apad("=====......"),
        apad("X.........."),
        apad(E),
        apad(E),
        apad("........^^^"),
        apad("........==="),
        apad("........vvv"),
        apad(E),
        apad(".........P."),
        apad(".......===="),
        apad(E),
        apad(E),
        apad(E),
        apad(E),
        apad(SU),
        W
      ]
    },
    {
      name: "过顶",
      sub: "OVER",
      hint: "先贴上沿等冷却。再翻下来，落到另一侧的台面上。",
      map: [
        W,
        apad(SD),
        apad(E),
        apad(E),
        apad("=====......"),
        apad(E),
        apad(E),
        apad(E),
        apad(E),
        apad(E),
        apad(".........X."),
        apad("...^^^^===="),
        apad(E),
        apad("P.........."),
        apad("===........"),
        apad(E),
        apad(E),
        apad(SU),
        W
      ]
    },
    {
      name: "折返",
      sub: "ZIG",
      hint: "贴上、翻下、再贴上。冷却没好转头就会扎进刺里。",
      map: [
        W,
        apad(SD),
        apad(E),
        apad("......====."),
        apad(".......X..."),
        apad(E),
        apad("=====......"),
        apad(E),
        apad(E),
        apad(E),
        apad(E),
        apad(E),
        apad(E),
        apad("...^^^^===="),
        apad(E),
        apad("P.........."),
        apad("===........"),
        apad(E),
        apad(E),
        apad(SU),
        W
      ]
    },
    {
      name: "绝井",
      sub: "LAST",
      hint: "窄沿、夹刺、过顶。冷却不到就别翻。",
      map: [
        W,
        apad(SD),
        apad(E),
        apad(".........=="),
        apad("..........X"),
        apad(E),
        apad(E),
        apad("=====......"),
        apad(E),
        apad(E),
        apad(E),
        apad(E),
        apad(E),
        apad(E),
        apad(E),
        apad("...^^^^===="),
        apad(E),
        apad("P.........."),
        apad("===........"),
        apad(E),
        apad(E),
        apad(SU),
        W
      ]
    }
  ];

  function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function parseStage(stage) {
    const rows = stage.map.length;
    const solids = [];
    const spikes = [];
    let spawn = { x: TILE * 2, y: TILE * 2 };
    let exit = { x: TILE * 6, y: TILE * 2 };
    let foundP = false;
    let foundX = false;
    for (let r = 0; r < rows; r++) {
      const line = stage.map[r];
      if (line.length !== COLS) throw new Error(stage.name + " row " + r);
      for (let c = 0; c < COLS; c++) {
        const ch = line[c];
        const x = c * TILE;
        const y = r * TILE;
        if (ch === "#" || ch === "=") {
          solids.push({ x, y, w: TILE, h: TILE, kind: ch === "#" ? "wall" : "plat" });
        } else if (ch === "^") {
          spikes.push({ x: x + 3, y: y + 10, w: TILE - 6, h: TILE - 12, face: -1, cx: x, cy: y });
        } else if (ch === "v") {
          spikes.push({ x: x + 3, y: y + 2, w: TILE - 6, h: TILE - 12, face: 1, cx: x, cy: y });
        } else if (ch === "P") {
          foundP = true;
          spawn.x = x + TILE * 0.5;
          const below = r + 1 < rows ? stage.map[r + 1][c] : "";
          if (below === "#" || below === "=") spawn.y = (r + 1) * TILE - PR;
          else spawn.y = y + TILE * 0.5;
        } else if (ch === "X") {
          foundX = true;
          exit.x = x + TILE * 0.5;
          exit.y = y + TILE * 0.5;
        }
      }
    }
    if (!foundP) throw new Error(stage.name + " missing P");
    if (!foundX) throw new Error(stage.name + " missing X");
    return {
      rows,
      w: COLS * TILE,
      h: rows * TILE,
      solids,
      spikes,
      spawn,
      exit
    };
  }

  function makeState(index, demo) {
    const meta = STAGES[index];
    const world = parseStage(meta);
    return {
      index,
      meta,
      world,
      px: world.spawn.x,
      py: world.spawn.y,
      vx: 0,
      vy: 0,
      grav: 1,
      grounded: true,
      cool: 0,
      buffer: 0,
      facing: 1,
      time: 0,
      phase: "play",
      phaseT: 0,
      shake: 0,
      squash: 1,
      stretch: 1,
      flash: 0,
      readyFlash: 0,
      cause: "",
      demo: !!demo,
      wasReady: true
    };
  }

  function playerBox(st) {
    return { x: st.px - PR, y: st.py - PR, w: PR * 2, h: PR * 2 };
  }

  function hitSolid(st, x, y, w, h) {
    const list = st.world.solids;
    for (let i = 0; i < list.length; i++) {
      const s = list[i];
      if (rectsOverlap(x, y, w, h, s.x, s.y, s.w, s.h)) return s;
    }
    return null;
  }

  function hitSpike(st) {
    const b = playerBox(st);
    const list = st.world.spikes;
    for (let i = 0; i < list.length; i++) {
      const s = list[i];
      if (rectsOverlap(b.x, b.y, b.w, b.h, s.x, s.y, s.w, s.h)) return s;
    }
    return null;
  }

  function tryFlip(st) {
    if (st.phase !== "play") return "dead";
    if (st.cool > 0) {
      st.buffer = FLIP_BUF;
      return "deny";
    }
    const old = st.grav;
    st.grav *= -1;
    st.cool = COOL_T;
    st.buffer = 0;
    st.grounded = false;
    st.py -= old * 4;
    st.vy += st.grav * FLIP_KICK;
    st.squash = 1.28;
    st.stretch = 0.72;
    st.flash = 0.28;
    return "flip";
  }

  function beginDie(st, cause) {
    if (st.phase !== "play" || st.demo) return;
    st.phase = "dead";
    st.phaseT = 0;
    st.cause = cause;
    st.vx = 0;
    st.vy = 0;
    st.shake = 8;
    st.flash = 0.55;
  }

  function beginClear(st) {
    if (st.phase !== "play" || st.demo) return;
    st.phase = "clear";
    st.phaseT = 0;
    st.vx *= 0.2;
    st.vy *= 0.2;
    st.flash = 0.45;
  }

  function step(st, inp, dt) {
    dt = clamp(dt, 0, 0.034);
    st.time += dt;
    if (st.shake > 0) st.shake = Math.max(0, st.shake - dt * 18);
    st.squash = lerp(st.squash, 1, clamp(dt * 12, 0, 1));
    st.stretch = lerp(st.stretch, 1, clamp(dt * 12, 0, 1));
    st.flash = Math.max(0, st.flash - dt * 2.4);
    st.readyFlash = Math.max(0, st.readyFlash - dt * 2.2);

    if (st.phase === "dead" || st.phase === "clear") {
      st.phaseT += dt;
      return st.phaseT >= (st.phase === "dead" ? DIE_T : CLEAR_T) ? st.phase : null;
    }
    if (st.phase !== "play") return null;

    const ready = st.cool <= 0;
    if (st.cool > 0) st.cool = Math.max(0, st.cool - dt);
    if (!ready && st.cool <= 0) st.readyFlash = 1;

    if (inp.flip) st.buffer = FLIP_BUF;
    if (st.buffer > 0) st.buffer = Math.max(0, st.buffer - dt);
    if (st.buffer > 0 && st.cool <= 0) {
      const r = tryFlip(st);
      if (r === "flip") return "flip";
    }

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
      st.vx *= Math.max(0, 1 - dt * AIR_DRAG);
    }

    st.vy += st.grav * GRAV_ACC * dt;
    if (st.grav > 0 && st.vy > MAX_V) st.vy = MAX_V;
    if (st.grav < 0 && st.vy < -MAX_V) st.vy = -MAX_V;

    st.px += st.vx * dt;
    let hit = hitSolid(st, st.px - PR, st.py - PR, PR * 2, PR * 2);
    if (hit) {
      if (st.vx > 0) st.px = hit.x - PR;
      else if (st.vx < 0) st.px = hit.x + hit.w + PR;
      else {
        const hx = hit.x + hit.w * 0.5;
        st.px = st.px < hx ? hit.x - PR : hit.x + hit.w + PR;
      }
      st.vx = 0;
    }

    const prevTop = st.py - PR;
    const prevBot = st.py + PR;
    st.py += st.vy * dt;
    hit = hitSolid(st, st.px - PR, st.py - PR, PR * 2, PR * 2);
    const wasG = st.grounded;
    st.grounded = false;
    let landed = false;
    if (hit) {
      if (st.vy > 0 && prevBot <= hit.y + 10) {
        st.py = hit.y - PR;
        st.vy = 0;
        if (st.grav > 0) {
          st.grounded = true;
          landed = !wasG;
        }
      } else if (st.vy < 0 && prevTop >= hit.y + hit.h - 10) {
        st.py = hit.y + hit.h + PR;
        st.vy = 0;
        if (st.grav < 0) {
          st.grounded = true;
          landed = !wasG;
        }
      } else {
        if (st.py < hit.y + hit.h * 0.5) st.py = hit.y - PR;
        else st.py = hit.y + hit.h + PR;
        st.vy = 0;
      }
    }

    if (landed) {
      st.squash = 0.7;
      st.stretch = 1.28;
      st.shake = Math.max(st.shake, 2.2);
    }

    if (!st.demo) {
      const dx = st.px - st.world.exit.x;
      const dy = st.py - st.world.exit.y;
      if (dx * dx + dy * dy < (EXIT_R + PR) * (EXIT_R + PR)) {
        beginClear(st);
        return "clearing";
      }
      if (hitSpike(st)) {
        beginDie(st, "spike");
        return "dying";
      }
      if (st.py < -36 || st.py > st.world.h + 36 || st.px < -20 || st.px > st.world.w + 20) {
        beginDie(st, "void");
        return "dying";
      }
    }
    return landed ? "land" : null;
  }

  function makeAI(index) {
    let flipped = 0;
    let phase = 0;
    return function (st) {
      const inp = { left: false, right: false, flip: false };
      const x = st.px;
      const g = st.grav;
      const gd = st.grounded;
      const y = st.py;
      const cool = st.cool;

      if (index === 0) {
        if (g > 0 && gd && cool <= 0 && st.time > 0.18) inp.flip = true;
        return inp;
      }
      if (index === 1) {
        inp.left = x > 70;
        if (g > 0 && gd && y > 380 && cool <= 0) inp.flip = true;
        return inp;
      }
      if (index === 2) {
        inp.right = x < 310;
        if (!gd && g > 0 && x > 150 && y > 280 && cool <= 0) inp.flip = true;
        return inp;
      }
      if (index === 3) {
        inp.left = x > 70;
        if (!gd && g > 0 && x < 200 && y > 340 && y < 480 && cool <= 0) inp.flip = true;
        return inp;
      }
      if (index === 4) {
        inp.right = x < 320;
        if (!gd && g > 0 && x > 160 && y > 300 && cool <= 0) inp.flip = true;
        return inp;
      }
      if (index === 5) {
        if (phase === 0) {
          if (gd && g > 0 && cool <= 0 && st.time > 0.12) {
            inp.flip = true;
            phase = 1;
          }
        } else if (phase === 1) {
          if (gd && g < 0 && y > 390) {
            if (cool <= 0) inp.left = true;
          } else if (gd && g < 0) {
            inp.left = x > 100;
          } else if (!gd && g < 0 && y < 400) {
            inp.left = x > 140;
          }
        }
        return inp;
      }
      if (index === 6) {
        inp.left = x > 70;
        if (g > 0 && gd && y > 470 && cool <= 0) inp.flip = true;
        return inp;
      }
      if (index === 7) {
        inp.right = x < 350;
        if (!gd && g > 0 && x > 90 && y > 430 && cool <= 0) inp.flip = true;
        return inp;
      }
      if (index === 8) {
        inp.left = x > 70;
        if (g > 0 && x < 210 && cool <= 0 && st.time > 0.4) inp.flip = true;
        return inp;
      }
      if (index === 9) {
        if (phase === 0) {
          if (gd && g > 0 && cool <= 0 && st.time > 0.1) {
            inp.flip = true;
            phase = 1;
          }
        } else if (phase === 1) {
          if (gd && g < 0) {
            if (cool <= 0) {
              inp.right = x < 180;
              if (x > 168) {
                inp.flip = true;
                phase = 2;
              }
            }
          }
        } else {
          inp.right = x < 340;
        }
        return inp;
      }
      if (index === 10) {
        if (phase === 0) {
          if (gd && g > 0 && cool <= 0 && st.time > 0.1) {
            inp.flip = true;
            phase = 1;
          }
        } else if (phase === 1) {
          if (gd && g < 0 && y > 200) {
            if (cool <= 0) {
              inp.right = x < 180;
              if (x > 168) {
                inp.flip = true;
                phase = 2;
              }
            }
          }
        } else if (phase === 2) {
          inp.right = x < 340;
          if (gd && g > 0 && x > 280 && cool <= 0) {
            inp.flip = true;
            phase = 3;
          }
        } else {
          inp.left = x > 260;
          inp.right = x < 240;
        }
        return inp;
      }
      if (index === 11) {
        if (phase === 0) {
          if (gd && g > 0 && cool <= 0 && st.time > 0.1) {
            inp.flip = true;
            phase = 1;
          }
        } else if (phase === 1) {
          if (gd && g < 0 && y > 180) {
            if (cool <= 0) {
              inp.right = x < 180;
              if (x > 168) {
                inp.flip = true;
                phase = 2;
              }
            }
          }
        } else if (phase === 2) {
          inp.right = x < 360;
          if (gd && g > 0 && x > 310 && cool <= 0) {
            inp.flip = true;
            phase = 3;
          }
        } else {
          inp.right = x < 360;
        }
        return inp;
      }
      return inp;
    };
  }

  function simulateStage(index, maxTime, log) {
    const st = makeState(index);
    const ai = makeAI(index);
    const dt = 1 / 60;
    const limit = maxTime || 28;
    let t = 0;
    let flips = 0;
    while (t < limit && st.phase === "play") {
      const ev = step(st, ai(st), dt);
      if (ev === "flip") flips++;
      if (log && (ev === "flip" || ev === "land" || ev === "dying" || (t * 60 | 0) % 12 === 0)) {
        console.log(
          "  t=" + t.toFixed(2),
          ev || ".",
          "x=" + st.px.toFixed(0),
          "y=" + st.py.toFixed(0),
          "g=" + st.grav,
          "gd=" + (st.grounded ? 1 : 0),
          "cool=" + st.cool.toFixed(2),
          "vy=" + st.vy.toFixed(0)
        );
      }
      t += dt;
    }
    return {
      name: STAGES[index].name,
      phase: st.phase,
      t: Math.round(t * 10) / 10,
      flips,
      x: Math.round(st.px),
      y: Math.round(st.py),
      grav: st.grav,
      cause: st.cause
    };
  }

  function validateStages() {
    STAGES.forEach((s, i) => {
      if (!s.name || !s.sub || !s.hint) throw new Error("meta " + i);
      parseStage(s);
    });
  }

  validateStages();

  if (typeof document === "undefined") {
    const results = STAGES.map((_, i) => simulateStage(i, 40, false));
    results.forEach((r, i) => {
      const mark = r.phase === "clear" ? "OK" : "FAIL";
      console.log(mark, r.name, "phase=" + r.phase, "t=" + r.t, "flips=" + r.flips, "pos", r.x, r.y, "g", r.grav, r.cause || "");
      if (r.phase !== "clear") simulateStage(i, 8, true);
    });
    const failed = results.filter((r) => r.phase !== "clear");
    if (failed.length) {
      console.error("unreachable", failed.map((f) => f.name).join(","));
      process.exitCode = 1;
    } else {
      console.log("flip-well maps ok", STAGES.length);
    }
    return;
  }

  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d", { alpha: false });
  const overlay = document.getElementById("overlay");
  const panel = overlay.querySelector(".panel");
  const ovKicker = document.getElementById("ov-kicker");
  const ovTitle = document.getElementById("ov-title");
  const ovLead = document.getElementById("ov-lead");
  const ovOps = document.getElementById("ov-ops");
  const ovBtn = document.getElementById("ov-btn");
  const stageLabel = document.getElementById("stage-label");
  const coolFill = document.getElementById("cool-fill");
  const coolWrap = coolFill.parentElement;
  const gravLabel = document.getElementById("grav-label");
  const toastEl = document.getElementById("toast");
  const hintEl = document.getElementById("hint");
  const btnMute = document.getElementById("btn-mute");
  const btnRetry = document.getElementById("btn-retry");
  const btnFlip = document.getElementById("btn-flip");
  const padEl = document.getElementById("pad");
  const btnLeft = document.getElementById("btn-left");
  const btnRight = document.getElementById("btn-right");
  const btnFlipPad = document.getElementById("btn-flip-pad");

  const coarse = window.matchMedia("(pointer: coarse)").matches;
  if (coarse) {
    hintEl.textContent = "左 / 右平移 · 翻 · 冷却转满才能再翻";
    padEl.style.display = "flex";
  }

  const keys = { left: false, right: false };
  const pad = { left: false, right: false };
  const pointer = { down: false, x: 0, id: null };
  let flipQueued = false;

  const view = { scale: 1, ox: 0, oy: 0, cssW: 1, cssH: 1, dpr: 1, camY: 0 };
  const dust = [];
  const particles = [];
  const after = [];
  const ripples = [];

  let mode = "title";
  let overlayKind = "title";
  let st = makeState(0, true);
  let toastT = 0;
  let frozen = false;
  let paused = false;
  let last = 0;

  function burst(x, y, rgb, n, spd, gravPull) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = spd * (0.25 + Math.random());
      particles.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s + (gravPull || 0),
        t: 0,
        life: 0.28 + Math.random() * 0.5,
        rgb,
        r: 1.1 + Math.random() * 2.4
      });
    }
  }

  function makeDust() {
    dust.length = 0;
    const h = st.world.h;
    const n = 48 + ((h / TILE) | 0);
    for (let i = 0; i < n; i++) {
      dust.push({
        x: Math.random() * st.world.w,
        y: Math.random() * h,
        r: 0.6 + Math.random() * 1.4,
        a: 0.08 + Math.random() * 0.22,
        s: 18 + Math.random() * 38,
        p: Math.random() * Math.PI * 2
      });
    }
  }

  const SFX = {
    ctx: null,
    master: null,
    drone: null,
    droneG: null,
    muted: false,
    ensure() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.22;
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
    flip() {
      this.ensure();
      this.beep(220, 0.16, "sine", 0.08, 520);
      this.beep(90, 0.2, "triangle", 0.05, 40);
    },
    land() {
      this.ensure();
      this.beep(160, 0.08, "sine", 0.045, 70);
    },
    ready() {
      this.ensure();
      this.beep(880, 0.07, "triangle", 0.035, 1320);
    },
    deny() {
      this.ensure();
      this.beep(140, 0.1, "square", 0.035, 70);
    },
    die() {
      this.ensure();
      this.noise(0.14, 0.08);
      this.beep(240, 0.42, "sawtooth", 0.07, 50);
    },
    clear() {
      this.ensure();
      this.beep(520, 0.14, "sine", 0.07, 780);
      this.beep(780, 0.22, "sine", 0.06, 1040);
    },
    win() {
      this.ensure();
      this.beep(440, 0.16, "triangle", 0.08, 660);
      this.beep(660, 0.28, "sine", 0.07, 990);
      this.beep(880, 0.4, "sine", 0.06, 1320);
    },
    start() {
      this.ensure();
      this.beep(180, 0.14, "sine", 0.06, 360);
    },
    tickDrone(grav) {
      if (!this.ctx || this.muted) return;
      if (!this.drone) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = "sine";
        o.frequency.value = 62;
        g.gain.value = 0.012;
        o.connect(g);
        g.connect(this.master);
        o.start();
        this.drone = o;
        this.droneG = g;
      }
      const t = this.ctx.currentTime;
      this.drone.frequency.setTargetAtTime(grav > 0 ? 58 : 76, t, 0.12);
      this.droneG.gain.setTargetAtTime(mode === "play" && !frozen ? 0.016 : 0.008, t, 0.2);
    }
  };

  try {
    if (localStorage.getItem("flip-well-mute") === "1") SFX.muted = true;
  } catch (_) { /* ignore */ }

  function syncMuteBtn() {
    btnMute.textContent = SFX.muted ? "静" : "声";
    btnMute.classList.toggle("muted", SFX.muted);
  }
  syncMuteBtn();

  function setMuted(m) {
    SFX.muted = m;
    if (SFX.master) SFX.master.gain.value = m ? 0 : 0.22;
    syncMuteBtn();
    try { localStorage.setItem("flip-well-mute", m ? "1" : "0"); } catch (_) { /* ignore */ }
  }

  function showToast(text) {
    toastEl.textContent = text;
    toastEl.classList.remove("hidden");
    toastT = 1.65;
  }

  function syncHud() {
    if (mode === "title") {
      stageLabel.textContent = "冷却翻转";
    } else {
      stageLabel.textContent = (st.index + 1) + " / " + STAGES.length + "　" + st.meta.name;
    }
    const ready = st.cool <= 0;
    const pct = ready ? 100 : (1 - st.cool / COOL_T) * 100;
    coolFill.style.width = pct + "%";
    coolWrap.classList.toggle("ready", ready && mode === "play");
    coolWrap.classList.toggle("wait", !ready);
    gravLabel.textContent = st.grav > 0 ? "重力 ↓" : "重力 ↑";
    gravLabel.className = "grav " + (st.grav > 0 ? "down" : "up");
    btnFlip.classList.toggle("wait", !ready);
    btnFlipPad.classList.toggle("wait", !ready);
  }

  function setOverlay(kind) {
    overlayKind = kind;
    overlay.classList.remove("hidden");
    panel.classList.remove("win", "lose");
    frozen = true;
    if (kind === "title") {
      ovKicker.textContent = "FLIP";
      ovTitle.textContent = "井翻";
      ovLead.textContent = "冷却转满才能翻转重力。落地要算好，刺面会吞人。";
      ovOps.textContent = coarse
        ? "左 / 右平移 · 翻 · 共" + STAGES.length + "口井 · M 静音"
        : "方向键 / A D 平移 · 空格或点按翻转 · 触屏用左翻右 · 共" + STAGES.length + "口井 · M 静音";
      ovBtn.textContent = "下井";
    } else if (kind === "dead") {
      panel.classList.add("lose");
      ovKicker.textContent = "FALL";
      ovTitle.textContent = st.cause === "void" ? "坠入井底" : "刺面";
      ovLead.textContent = st.cause === "void"
        ? "井没有底。没落到台面上，就被暗处吞掉了。"
        : "那一面不是给你落的。冷却好了再翻，贴着安全的那一面。";
      ovOps.textContent = "本井重来。翻转有冷却，落地要算提前量。";
      ovBtn.textContent = "再落一次";
    } else if (kind === "win") {
      panel.classList.add("win");
      ovKicker.textContent = "WELL";
      ovTitle.textContent = "出井";
      ovLead.textContent = STAGES.length + " 口井，每一次都踩在冷却之后。井把你送回了光里。";
      ovOps.textContent = "";
      ovBtn.textContent = "再来一局";
    }
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
    frozen = false;
    overlayKind = "none";
  }

  function resetFx() {
    particles.length = 0;
    after.length = 0;
    ripples.length = 0;
  }

  function loadTitle() {
    mode = "title";
    st = makeState(0, true);
    view.camY = st.py - 180;
    resetFx();
    makeDust();
    setOverlay("title");
    syncHud();
  }

  function loadStage(i) {
    mode = "play";
    st = makeState(i, false);
    view.camY = st.py - 160;
    resetFx();
    makeDust();
    hideOverlay();
    syncHud();
    showToast((i + 1) + " / " + STAGES.length + "　" + STAGES[i].name + " · " + STAGES[i].hint);
    hintEl.textContent = coarse
      ? STAGES[i].hint + " · 左 / 右 / 翻"
      : STAGES[i].hint + " · A D 平移 · 空格翻转";
  }

  function queueFlip() {
    if (frozen || mode !== "play") return;
    flipQueued = true;
  }

  function onFlipResult(ev) {
    if (ev === "flip") {
      SFX.flip();
      ripples.push({ x: st.px, y: st.py, r: 8, a: 0.9, g: st.grav });
      burst(st.px, st.py, st.grav < 0 ? "0,240,255" : "255,61,184", 14, 140, st.grav * 40);
      after.push({ x: st.px, y: st.py, t: 0, g: st.grav });
    } else if (ev === "deny" || (flipQueued && st.cool > 0 && st.phase === "play")) {
      SFX.deny();
      st.readyFlash = 0.4;
    }
  }

  function gatherInput() {
    let left = keys.left || pad.left;
    let right = keys.right || pad.right;
    let flip = flipQueued;
    flipQueued = false;
    if (pointer.down && pointer.id !== "pad") {
      if (pointer.x < view.cssW * 0.28) left = true;
      else if (pointer.x > view.cssW * 0.72) right = true;
    }
    return { left, right, flip };
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
    const worldW = st.world.w;
    const scale = cssW / (worldW + 28);
    view.scale = scale;
    view.ox = (cssW - worldW * scale) / 2;
    view.oy = 0;
    view.cssW = cssW;
    view.cssH = cssH;
    view.dpr = dpr;
  }

  function brickShade(c, r) {
    let h = (c * 73 + r * 19 + 11) % 7;
    return 10 + h * 2;
  }

  function drawRoundRect(x, y, w, h, rad) {
    const rr = Math.min(rad, w * 0.5, h * 0.5);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function drawSpikes() {
    const list = st.world.spikes;
    for (let i = 0; i < list.length; i++) {
      const s = list[i];
      const x = s.cx;
      const y = s.cy;
      const up = s.face < 0;
      ctx.fillStyle = MAG;
      ctx.shadowColor = "rgba(255,61,184,0.55)";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      const n = 2;
      for (let k = 0; k < n; k++) {
        const x0 = x + 3 + k * ((TILE - 6) / n);
        const x1 = x0 + (TILE - 6) / n;
        const xm = (x0 + x1) * 0.5;
        if (up) {
          ctx.moveTo(x0 + 1, y + TILE - 3);
          ctx.lineTo(xm, y + 4);
          ctx.lineTo(x1 - 1, y + TILE - 3);
        } else {
          ctx.moveTo(x0 + 1, y + 3);
          ctx.lineTo(xm, y + TILE - 4);
          ctx.lineTo(x1 - 1, y + 3);
        }
      }
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  function drawWorld(now) {
    const dpr = view.dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#05030c";
    ctx.fillRect(0, 0, view.cssW, view.cssH);

    const visH = view.cssH / view.scale;
    const targetCam = st.py - visH * 0.46;
    const camMax = Math.max(0, st.world.h - visH);
    const camWant = clamp(targetCam, 0, camMax);
    view.camY = lerp(view.camY, camWant, frozen ? 0.08 : 0.14);

    const shx = st.shake ? (Math.random() - 0.5) * st.shake : 0;
    const shy = st.shake ? (Math.random() - 0.5) * st.shake : 0;
    ctx.translate(view.ox + shx, view.oy + shy);
    ctx.scale(view.scale, view.scale);
    ctx.translate(0, -view.camY);

    const Wd = st.world.w;
    const Hd = st.world.h;
    const bg = ctx.createLinearGradient(0, 0, 0, Hd);
    bg.addColorStop(0, "#0c0820");
    bg.addColorStop(0.5, "#070412");
    bg.addColorStop(1, "#120814");
    ctx.fillStyle = bg;
    ctx.fillRect(-40, -40, Wd + 80, Hd + 80);

    const gdir = st.grav;
    for (let i = 0; i < dust.length; i++) {
      const d = dust[i];
      const tw = 0.55 + Math.sin(st.time * 1.3 + d.p) * 0.45;
      ctx.fillStyle = "rgba(180,220,255," + (d.a * tw) + ")";
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = "rgba(0,240,255,0.05)";
    ctx.lineWidth = 1;
    for (let y = TILE; y < Hd; y += TILE * 2) {
      ctx.beginPath();
      ctx.moveTo(TILE, y);
      ctx.lineTo(Wd - TILE, y);
      ctx.stroke();
    }

    const solids = st.world.solids;
    for (let i = 0; i < solids.length; i++) {
      const s = solids[i];
      const c = (s.x / TILE) | 0;
      const r = (s.y / TILE) | 0;
      if (s.kind === "wall") {
        const sh = brickShade(c, r);
        ctx.fillStyle = "rgb(" + sh + "," + (sh - 2) + "," + (sh + 10) + ")";
        ctx.fillRect(s.x, s.y, s.w, s.h);
        ctx.strokeStyle = "rgba(0,240,255,0.07)";
        ctx.strokeRect(s.x + 0.5, s.y + 0.5, s.w - 1, s.h - 1);
        if ((c + r) % 5 === 0) {
          ctx.fillStyle = "rgba(0,240,255,0.05)";
          ctx.fillRect(s.x + 6, s.y + 8, 8, 5);
        }
        if ((c * 3 + r) % 7 === 0) {
          ctx.fillStyle = "rgba(255,61,184,0.06)";
          ctx.fillRect(s.x + 10, s.y + 14, 7, 4);
        }
      } else {
        ctx.fillStyle = "#141022";
        drawRoundRect(s.x + 1, s.y + 3, s.w - 2, s.h - 6, 5);
        ctx.fill();
        ctx.strokeStyle = "rgba(0,240,255,0.55)";
        ctx.shadowColor = "rgba(0,240,255,0.35)";
        ctx.shadowBlur = 8;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(s.x + 3, s.y + 4);
        ctx.lineTo(s.x + s.w - 3, s.y + 4);
        ctx.stroke();
        ctx.strokeStyle = "rgba(255,61,184,0.5)";
        ctx.shadowColor = "rgba(255,61,184,0.3)";
        ctx.beginPath();
        ctx.moveTo(s.x + 3, s.y + s.h - 4);
        ctx.lineTo(s.x + s.w - 3, s.y + s.h - 4);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }

    drawSpikes();

    const ex = st.world.exit;
    const spin = st.time * 2.2;
    ctx.save();
    ctx.translate(ex.x, ex.y);
    ctx.rotate(spin);
    ctx.strokeStyle = CYAN;
    ctx.shadowColor = "rgba(0,240,255,0.7)";
    ctx.shadowBlur = 14;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.rotate(-spin * 1.6);
    ctx.strokeStyle = GOLD;
    ctx.shadowColor = "rgba(255,227,107,0.6)";
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 1.4);
    ctx.stroke();
    ctx.restore();
    ctx.shadowBlur = 0;
    const pulse = 0.45 + Math.sin(st.time * 4) * 0.2;
    ctx.fillStyle = "rgba(0,240,255," + pulse + ")";
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, 3.5, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < after.length; i++) {
      const a = after[i];
      const k = 1 - a.t / 0.45;
      ctx.globalAlpha = Math.max(0, k) * 0.35;
      ctx.fillStyle = a.g < 0 ? CYAN : MAG;
      ctx.beginPath();
      ctx.arc(a.x, a.y, PR * (1 + a.t), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    for (let i = 0; i < ripples.length; i++) {
      const rp = ripples[i];
      ctx.strokeStyle = rp.g < 0 ? "rgba(0,240,255," + rp.a + ")" : "rgba(255,61,184," + rp.a + ")";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const k = 1 - p.t / p.life;
      ctx.fillStyle = "rgba(" + p.rgb + "," + (k * 0.9) + ")";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * k, 0, Math.PI * 2);
      ctx.fill();
    }

    if (st.phase !== "dead" || (st.phaseT * 18 | 0) % 2 === 0) {
      const pw = PR * 2 * st.stretch;
      const ph = PR * 2 * st.squash;
      ctx.save();
      ctx.translate(st.px, st.py);
      ctx.fillStyle = "rgba(255,61,184,0.18)";
      ctx.beginPath();
      ctx.arc(0, 0, PR + 7, 0, Math.PI * 2);
      ctx.fill();
      const grd = ctx.createRadialGradient(-3, -3, 2, 0, 0, PR);
      grd.addColorStop(0, "#ffe6f7");
      grd.addColorStop(0.45, MAG);
      grd.addColorStop(1, "#6b1248");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.ellipse(0, 0, pw * 0.5, ph * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = st.cool <= 0 ? CYAN : "rgba(255,61,184,0.55)";
      ctx.lineWidth = 2.2;
      ctx.shadowColor = st.cool <= 0 ? "rgba(0,240,255,0.8)" : "rgba(255,61,184,0.4)";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      const ready = st.cool <= 0 ? 1 : 1 - st.cool / COOL_T;
      ctx.arc(0, 0, PR + 5, -Math.PI / 2, -Math.PI / 2 + ready * Math.PI * 2, false);
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.fillStyle = st.grav > 0 ? MAG : CYAN;
      ctx.beginPath();
      if (st.grav > 0) {
        ctx.moveTo(-4, 3);
        ctx.lineTo(4, 3);
        ctx.lineTo(0, 8);
      } else {
        ctx.moveTo(-4, -3);
        ctx.lineTo(4, -3);
        ctx.lineTo(0, -8);
      }
      ctx.fill();
      ctx.restore();
    }

    if (st.flash > 0) {
      ctx.fillStyle = st.phase === "dead"
        ? "rgba(255,61,184," + (st.flash * 0.28) + ")"
        : "rgba(0,240,255," + (st.flash * 0.18) + ")";
      ctx.fillRect(-40, view.camY - 40, Wd + 80, visH + 80);
    }

    const vig = ctx.createRadialGradient(st.px, st.py, 40, st.px, st.py, visH * 0.75);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(5,3,12,0.42)");
    ctx.fillStyle = vig;
    ctx.fillRect(-40, view.camY - 40, Wd + 80, visH + 80);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  function updateFx(dt) {
    for (let i = dust.length - 1; i >= 0; i--) {
      const d = dust[i];
      d.y += st.grav * d.s * dt;
      if (d.y > st.world.h + 8) d.y = -6;
      if (d.y < -8) d.y = st.world.h + 6;
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += st.grav * 220 * dt;
      if (p.t >= p.life) particles.splice(i, 1);
    }
    for (let i = after.length - 1; i >= 0; i--) {
      after[i].t += dt;
      if (after[i].t > 0.45) after.splice(i, 1);
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      const rp = ripples[i];
      rp.r += dt * 220;
      rp.a -= dt * 1.6;
      if (rp.a <= 0) ripples.splice(i, 1);
    }
    if (toastT > 0) {
      toastT -= dt;
      if (toastT <= 0) toastEl.classList.add("hidden");
    }
  }

  function handleEvent(ev) {
    if (ev === "flip") {
      onFlipResult("flip");
    } else if (ev === "land") {
      SFX.land();
      burst(st.px, st.py + st.grav * PR, "200,240,255", 8, 70, -st.grav * 30);
    } else if (ev === "dying") {
      SFX.die();
      burst(st.px, st.py, "255,61,184", 26, 180, 0);
    } else if (ev === "clearing") {
      if (st.index >= STAGES.length - 1) SFX.win();
      else SFX.clear();
      burst(st.world.exit.x, st.world.exit.y, "0,240,255", 22, 160, 0);
      burst(st.world.exit.x, st.world.exit.y, "255,227,107", 10, 90, 0);
    } else if (ev === "dead") {
      if (mode === "play") setOverlay("dead");
    } else if (ev === "clear") {
      if (st.index >= STAGES.length - 1) {
        mode = "win";
        setOverlay("win");
      } else {
        loadStage(st.index + 1);
      }
    }
  }

  function titleAI() {
    const inp = { left: false, right: false, flip: false };
    if (st.grounded && st.cool <= 0 && st.time > 0.55) inp.flip = true;
    return inp;
  }

  function frame(ts) {
    requestAnimationFrame(frame);
    if (!last) last = ts;
    let dt = (ts - last) / 1000;
    last = ts;
    if (dt > 0.05) dt = 0.05;
    if (paused) {
      drawWorld(ts);
      return;
    }
    fit();

    if (mode === "title") {
      const ev = step(st, titleAI(), dt);
      if (ev === "flip") {
        ripples.push({ x: st.px, y: st.py, r: 8, a: 0.7, g: st.grav });
      }
      updateFx(dt);
      drawWorld(ts);
      syncHud();
      return;
    }

    if (!frozen && mode === "play") {
      const wasReady = st.cool <= 0;
      const inp = gatherInput();
      const tried = inp.flip;
      const ev = step(st, inp, dt);
      if (ev === "flip") handleEvent("flip");
      else if (tried && st.cool > 0 && st.phase === "play") SFX.deny();
      if (ev === "land") handleEvent("land");
      if (ev === "dying") handleEvent("dying");
      if (ev === "clearing") handleEvent("clearing");
      if (ev === "dead") handleEvent("dead");
      if (ev === "clear") handleEvent("clear");
      if (!wasReady && st.cool <= 0 && st.phase === "play") SFX.ready();
      SFX.tickDrone(st.grav);
    } else if (st.phase === "dead" || st.phase === "clear") {
      const ev = step(st, { left: false, right: false, flip: false }, dt);
      if (ev === "dead" || ev === "clear") handleEvent(ev);
    }

    updateFx(dt);
    drawWorld(ts);
    syncHud();
  }

  function bindHold(el, key) {
    const down = (e) => {
      e.preventDefault();
      pad[key] = true;
      el.classList.add("held");
      pointer.id = "pad";
      SFX.ensure();
    };
    const up = (e) => {
      if (e) e.preventDefault();
      pad[key] = false;
      el.classList.remove("held");
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("pointerleave", up);
  }
  bindHold(btnLeft, "left");
  bindHold(btnRight, "right");

  function bindFlipBtn(el) {
    el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      el.classList.add("held");
      pointer.id = "pad";
      SFX.ensure();
      queueFlip();
    });
    const up = () => el.classList.remove("held");
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("pointerleave", up);
  }
  bindFlipBtn(btnFlip);
  bindFlipBtn(btnFlipPad);

  canvas.addEventListener("pointerdown", (e) => {
    if (frozen) return;
    SFX.ensure();
    pointer.down = true;
    pointer.id = e.pointerId;
    const rect = canvas.getBoundingClientRect();
    pointer.x = e.clientX - rect.left;
    canvas.setPointerCapture(e.pointerId);
    if (mode === "play") queueFlip();
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!pointer.down) return;
    const rect = canvas.getBoundingClientRect();
    pointer.x = e.clientX - rect.left;
  });
  function pointerEnd(e) {
    if (pointer.id !== e.pointerId) return;
    pointer.down = false;
    pointer.id = null;
  }
  canvas.addEventListener("pointerup", pointerEnd);
  canvas.addEventListener("pointercancel", pointerEnd);

  window.addEventListener("keydown", (e) => {
    const code = e.code;
    if (code === "ArrowLeft" || code === "KeyA") { keys.left = true; e.preventDefault(); }
    if (code === "ArrowRight" || code === "KeyD") { keys.right = true; e.preventDefault(); }
    if (code === "KeyM") {
      setMuted(!SFX.muted);
      e.preventDefault();
      return;
    }
    if (code === "KeyR") {
      e.preventDefault();
      SFX.ensure();
      if (overlayKind === "win" || overlayKind === "title") loadStage(0);
      else loadStage(st.index);
      return;
    }
    if (code === "Space" || code === "Enter" || code === "ArrowUp" || code === "KeyW") {
      e.preventDefault();
      if (e.repeat) return;
      SFX.ensure();
      if (frozen) {
        ovBtn.click();
        return;
      }
      if (code === "Space" || code === "ArrowUp" || code === "KeyW") queueFlip();
    }
  });
  window.addEventListener("keyup", (e) => {
    if (e.code === "ArrowLeft" || e.code === "KeyA") keys.left = false;
    if (e.code === "ArrowRight" || e.code === "KeyD") keys.right = false;
  });

  ovBtn.addEventListener("click", () => {
    SFX.ensure();
    SFX.start();
    if (overlayKind === "title" || overlayKind === "win") loadStage(0);
    else if (overlayKind === "dead") loadStage(st.index);
  });
  btnRetry.addEventListener("click", () => {
    SFX.ensure();
    if (overlayKind === "win" || overlayKind === "title") loadStage(0);
    else loadStage(st.index);
  });
  btnMute.addEventListener("click", () => {
    SFX.ensure();
    setMuted(!SFX.muted);
  });

  document.addEventListener("visibilitychange", () => {
    paused = document.hidden;
    if (!paused) last = 0;
  });
  window.addEventListener("blur", () => {
    keys.left = keys.right = false;
  });

  loadTitle();
  fit();
  requestAnimationFrame(frame);
})();
