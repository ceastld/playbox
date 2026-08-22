(() => {
  "use strict";

  var DX = [1, -1, 0, 0];
  var DY = [0, 0, 1, -1];
  var TAU = Math.PI * 2;
  var MOVE_MS = 92;
  var WIN_HOLD = 320;
  var SWIPE_MIN = 24;
  var SOLVE_CAP = 90;
  var GEN_CAP = 120;
  var CHECK_CAP = 1500;
  var MUTE_KEY = "playbox-soko-box-mute";
  var CLEAR_KEY = "playbox-soko-box-cleared";
  var DAILY_W = 8;
  var DAILY_H = 6;

  var LEVELS = [
    {
      name: "直入",
      map: [
        "#####",
        "#   #",
        "#@$.#",
        "#   #",
        "#####"
      ]
    },
    {
      name: "绕后",
      map: [
        "#######",
        "#     #",
        "# .$ @#",
        "#     #",
        "#######"
      ]
    },
    {
      name: "拐角",
      map: [
        "######",
        "#    #",
        "# $  #",
        "#@# .#",
        "#    #",
        "######"
      ]
    },
    {
      name: "折墙",
      map: [
        "#######",
        "#     #",
        "#  $  #",
        "#  ##.#",
        "#  @  #",
        "#######"
      ]
    },
    {
      name: "双印",
      map: [
        "######",
        "#    #",
        "# $$ #",
        "#@ ..#",
        "######"
      ]
    },
    {
      name: "分道",
      map: [
        "########",
        "#      #",
        "#@$$  .#",
        "#     .#",
        "########"
      ]
    },
    {
      name: "侧门",
      map: [
        "########",
        "#      #",
        "# $  $.#",
        "# @#  .#",
        "#      #",
        "########"
      ]
    },
    {
      name: "三连",
      map: [
        "#########",
        "#       #",
        "# $$$   #",
        "# @  ...#",
        "#########"
      ]
    },
    {
      name: "夹壁",
      map: [
        "#########",
        "#       #",
        "# . # $ #",
        "#   #   #",
        "# .$@ $.#",
        "#       #",
        "#########"
      ]
    },
    {
      name: "深巷",
      map: [
        "##########",
        "#        #",
        "# #### #.#",
        "# #    #.#",
        "# # $$ #.#",
        "# #@  $  #",
        "#        #",
        "##########"
      ]
    },
    {
      name: "锁箱",
      map: [
        "##########",
        "#        #",
        "#  $.    #",
        "# # ##   #",
        "# #  $ . #",
        "# #@ $  .#",
        "#        #",
        "##########"
      ]
    },
    {
      name: "终局",
      map: [
        "##########",
        "#      . #",
        "#  ###   #",
        "#  # $  .#",
        "# $  $   #",
        "# @  ## .#",
        "#        #",
        "##########"
      ]
    }
  ];

  var FALLBACK = {
    name: "闲局",
    map: [
      "##########",
      "#        #",
      "#  $$  . #",
      "#  @#  . #",
      "#  $   . #",
      "#        #",
      "#        #",
      "##########"
    ]
  };

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function ease(t) {
    t = clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
  }

  function mulberry32(a) {
    return function () {
      a |= 0;
      a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function todayParts(d) {
    d = d || new Date();
    var y = d.getFullYear();
    var m = d.getMonth() + 1;
    var day = d.getDate();
    return {
      y: y,
      m: m,
      d: day,
      key: y + "-" + (m < 10 ? "0" : "") + m + "-" + (day < 10 ? "0" : "") + day,
      seed: y * 10000 + m * 100 + day,
      label: m + "月" + day + "日"
    };
  }

  function parseLevel(map) {
    var h = map.length;
    var w = map[0].length;
    var walls = [];
    var goals = [];
    var crates = [];
    var px = -1;
    var py = -1;
    var y;
    var x;
    var c;
    var nGoals = 0;
    for (y = 0; y < h; y++) {
      if (map[y].length !== w) throw new Error("ragged row " + y);
      walls[y] = [];
      goals[y] = [];
      for (x = 0; x < w; x++) {
        c = map[y][x];
        walls[y][x] = c === "#";
        goals[y][x] = c === "." || c === "*" || c === "+";
        if (goals[y][x]) nGoals += 1;
        if (c === "@" || c === "+") {
          if (px >= 0) throw new Error("two players");
          px = x;
          py = y;
        }
        if (c === "$" || c === "*") crates.push({ x: x, y: y });
      }
    }
    if (px < 0) throw new Error("no player");
    if (nGoals !== crates.length) throw new Error("crate/goal mismatch " + crates.length + "/" + nGoals);
    if (!crates.length) throw new Error("no crates");
    return {
      w: w,
      h: h,
      walls: walls,
      goals: goals,
      crates: crates,
      px: px,
      py: py
    };
  }

  function cloneCrates(crates) {
    var out = [];
    var i;
    for (i = 0; i < crates.length; i++) out.push({ x: crates[i].x, y: crates[i].y });
    return out;
  }

  function cloneState(st) {
    return {
      w: st.w,
      h: st.h,
      walls: st.walls,
      goals: st.goals,
      crates: cloneCrates(st.crates),
      px: st.px,
      py: st.py
    };
  }

  function crateAt(crates, x, y) {
    var i;
    for (i = 0; i < crates.length; i++) {
      if (crates[i].x === x && crates[i].y === y) return i;
    }
    return -1;
  }

  function isWall(st, x, y) {
    if (x < 0 || y < 0 || x >= st.w || y >= st.h) return true;
    return st.walls[y][x];
  }

  function isCornerDead(st, x, y) {
    if (st.goals[y][x]) return false;
    var left = isWall(st, x - 1, y);
    var right = isWall(st, x + 1, y);
    var up = isWall(st, x, y - 1);
    var down = isWall(st, x, y + 1);
    return (left && up) || (left && down) || (right && up) || (right && down);
  }

  function tryMove(st, dx, dy) {
    if (!dx && !dy) return null;
    var nx = st.px + dx;
    var ny = st.py + dy;
    if (isWall(st, nx, ny)) return null;
    var ci = crateAt(st.crates, nx, ny);
    var crates = cloneCrates(st.crates);
    var pushed = -1;
    if (ci >= 0) {
      var cx = nx + dx;
      var cy = ny + dy;
      if (isWall(st, cx, cy)) return null;
      if (crateAt(crates, cx, cy) >= 0) return null;
      crates[ci] = { x: cx, y: cy };
      pushed = ci;
    }
    return {
      w: st.w,
      h: st.h,
      walls: st.walls,
      goals: st.goals,
      crates: crates,
      px: nx,
      py: ny,
      pushed: pushed
    };
  }

  function seatedCount(st) {
    var n = 0;
    var i;
    var c;
    for (i = 0; i < st.crates.length; i++) {
      c = st.crates[i];
      if (st.goals[c.y][c.x]) n += 1;
    }
    return n;
  }

  function isWon(st) {
    return seatedCount(st) === st.crates.length;
  }

  function crateKey(crates) {
    var ids = [];
    var i;
    for (i = 0; i < crates.length; i++) ids.push((crates[i].y << 8) | crates[i].x);
    ids.sort(function (a, b) { return a - b; });
    return ids.join(",");
  }

  function encodeMap(st) {
    var rows = [];
    var y;
    var x;
    var line;
    var g;
    var cr;
    var p;
    for (y = 0; y < st.h; y++) {
      line = "";
      for (x = 0; x < st.w; x++) {
        if (st.walls[y][x]) {
          line += "#";
          continue;
        }
        g = st.goals[y][x];
        cr = crateAt(st.crates, x, y) >= 0;
        p = st.px === x && st.py === y;
        if (p && g) line += "+";
        else if (p) line += "@";
        else if (cr && g) line += "*";
        else if (cr) line += "$";
        else if (g) line += ".";
        else line += " ";
      }
      rows.push(line);
    }
    return rows;
  }

  function floodReach(st, mark, stamp) {
    var w = st.w;
    var h = st.h;
    var q = [st.px, st.py];
    var qi = 0;
    var minId = st.py * w + st.px;
    var x;
    var y;
    var k;
    var nx;
    var ny;
    var id;
    mark[st.py * w + st.px] = stamp;
    while (qi < q.length) {
      x = q[qi++];
      y = q[qi++];
      for (k = 0; k < 4; k++) {
        nx = x + DX[k];
        ny = y + DY[k];
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        if (st.walls[ny][nx]) continue;
        if (crateAt(st.crates, nx, ny) >= 0) continue;
        id = ny * w + nx;
        if (mark[id] === stamp) continue;
        mark[id] = stamp;
        if (id < minId) minId = id;
        q.push(nx, ny);
      }
    }
    return minId;
  }

  function solveLevel(st, capMs) {
    var t0 = Date.now();
    var w = st.w;
    var mark = new Int32Array(w * st.h);
    var stamp = 1;
    var seen = Object.create(null);
    var startMin = floodReach(st, mark, stamp);
    var startK = crateKey(st.crates) + ":" + startMin;
    seen[startK] = 1;
    var q = [cloneState(st)];
    var qi = 0;
    var nodes = 0;
    while (qi < q.length) {
      nodes += 1;
      if ((nodes & 31) === 0 && Date.now() - t0 > capMs) {
        return { ok: false, timeout: true, nodes: nodes };
      }
      var cur = q[qi++];
      if (isWon(cur)) return { ok: true, nodes: nodes };
      stamp += 1;
      if (stamp > 2000000000) {
        for (var z = 0; z < mark.length; z++) mark[z] = 0;
        stamp = 1;
      }
      floodReach(cur, mark, stamp);
      var reach = new Uint8Array(w * cur.h);
      var id;
      for (id = 0; id < reach.length; id++) {
        if (mark[id] === stamp) reach[id] = 1;
      }
      var i;
      var k;
      var crate;
      var sx;
      var sy;
      var tx;
      var ty;
      var next;
      var key;
      var minId;
      for (i = 0; i < cur.crates.length; i++) {
        crate = cur.crates[i];
        for (k = 0; k < 4; k++) {
          sx = crate.x - DX[k];
          sy = crate.y - DY[k];
          if (sx < 0 || sy < 0 || sx >= w || sy >= cur.h) continue;
          if (!reach[sy * w + sx]) continue;
          tx = crate.x + DX[k];
          ty = crate.y + DY[k];
          if (isWall(cur, tx, ty)) continue;
          if (crateAt(cur.crates, tx, ty) >= 0) continue;
          if (isCornerDead(cur, tx, ty)) continue;
          next = cloneState(cur);
          next.crates[i] = { x: tx, y: ty };
          next.px = crate.x;
          next.py = crate.y;
          stamp += 1;
          if (stamp > 2000000000) {
            for (z = 0; z < mark.length; z++) mark[z] = 0;
            stamp = 1;
          }
          minId = floodReach(next, mark, stamp);
          key = crateKey(next.crates) + ":" + minId;
          if (seen[key]) continue;
          seen[key] = 1;
          q.push(next);
        }
      }
    }
    return { ok: false, timeout: false, nodes: nodes };
  }

  function floorCells(st) {
    var cells = [];
    var y;
    var x;
    for (y = 0; y < st.h; y++) {
      for (x = 0; x < st.w; x++) {
        if (!st.walls[y][x]) cells.push({ x: x, y: y });
      }
    }
    return cells;
  }

  function connectedFloors(st) {
    var cells = floorCells(st);
    if (!cells.length) return false;
    var mark = new Int32Array(st.w * st.h);
    var start = cells[0];
    var tmp = {
      w: st.w,
      h: st.h,
      walls: st.walls,
      goals: st.goals,
      crates: [],
      px: start.x,
      py: start.y
    };
    floodReach(tmp, mark, 1);
    var i;
    var c;
    for (i = 0; i < cells.length; i++) {
      c = cells[i];
      if (mark[c.y * st.w + c.x] !== 1) return false;
    }
    return true;
  }

  function reversePulls(st, rng, steps) {
    var mark = new Int32Array(st.w * st.h);
    var stamp = 1;
    var n;
    var i;
    var k;
    var crate;
    var p1x;
    var p1y;
    var p2x;
    var p2y;
    var cand;
    var pick;
    var moved = 0;
    for (n = 0; n < steps; n++) {
      stamp += 1;
      floodReach(st, mark, stamp);
      cand = [];
      for (i = 0; i < st.crates.length; i++) {
        crate = st.crates[i];
        for (k = 0; k < 4; k++) {
          p1x = crate.x + DX[k];
          p1y = crate.y + DY[k];
          p2x = crate.x + DX[k] * 2;
          p2y = crate.y + DY[k] * 2;
          if (isWall(st, p1x, p1y) || isWall(st, p2x, p2y)) continue;
          if (crateAt(st.crates, p1x, p1y) >= 0) continue;
          if (crateAt(st.crates, p2x, p2y) >= 0) continue;
          if (mark[p1y * st.w + p1x] !== stamp) continue;
          if (isCornerDead(st, p1x, p1y)) continue;
          cand.push({ i: i, k: k, p1x: p1x, p1y: p1y, p2x: p2x, p2y: p2y });
        }
      }
      if (!cand.length) break;
      pick = cand[Math.floor(rng() * cand.length)];
      st.crates[pick.i] = { x: pick.p1x, y: pick.p1y };
      st.px = pick.p2x;
      st.py = pick.p2y;
      moved += 1;
    }
    return moved;
  }

  function randomDaily(rng) {
    var w = DAILY_W + 2;
    var h = DAILY_H + 2;
    var walls = [];
    var goals = [];
    var y;
    var x;
    var nWall;
    var tries;
    var fx;
    var fy;
    for (y = 0; y < h; y++) {
      walls[y] = [];
      goals[y] = [];
      for (x = 0; x < w; x++) {
        walls[y][x] = x === 0 || y === 0 || x === w - 1 || y === h - 1;
        goals[y][x] = false;
      }
    }
    nWall = 2 + Math.floor(rng() * 4);
    tries = 0;
    while (nWall > 0 && tries < 40) {
      tries += 1;
      fx = 2 + Math.floor(rng() * (DAILY_W - 2));
      fy = 2 + Math.floor(rng() * (DAILY_H - 2));
      if (walls[fy][fx]) continue;
      walls[fy][fx] = true;
      if (!connectedFloors({ w: w, h: h, walls: walls, goals: goals, crates: [], px: 1, py: 1 })) {
        walls[fy][fx] = false;
        continue;
      }
      nWall -= 1;
    }
    var floors = [];
    for (y = 1; y < h - 1; y++) {
      for (x = 1; x < w - 1; x++) {
        if (!walls[y][x]) floors.push({ x: x, y: y });
      }
    }
    if (floors.length < 10) return null;
    function takeFloor() {
      if (!floors.length) return null;
      var idx = Math.floor(rng() * floors.length);
      return floors.splice(idx, 1)[0];
    }
    var gcells = [];
    var gi;
    var cell;
    for (gi = 0; gi < 3; gi++) {
      cell = takeFloor();
      if (!cell) return null;
      goals[cell.y][cell.x] = true;
      gcells.push(cell);
    }
    var crates = [];
    for (gi = 0; gi < 3; gi++) crates.push({ x: gcells[gi].x, y: gcells[gi].y });
    var pcell = takeFloor();
    if (!pcell) return null;
    var st = {
      w: w,
      h: h,
      walls: walls,
      goals: goals,
      crates: crates,
      px: pcell.x,
      py: pcell.y
    };
    var pulls = 14 + Math.floor(rng() * 16);
    reversePulls(st, rng, pulls);
    if (seatedCount(st) >= 3) return null;
    if (seatedCount(st) > 1) return null;
    return st;
  }

  function generateDaily(seed, capMs) {
    var rng = mulberry32(seed >>> 0);
    var t0 = Date.now();
    var attempts = 0;
    var left;
    var st;
    var res;
    while (attempts < 64) {
      attempts += 1;
      left = capMs - (Date.now() - t0);
      if (left < 12) break;
      st = randomDaily(rng);
      if (!st) continue;
      res = solveLevel(st, Math.min(SOLVE_CAP, left));
      if (res.ok) {
        return {
          name: "每日",
          map: encodeMap(st),
          fallback: false,
          attempts: attempts
        };
      }
    }
    return {
      name: FALLBACK.name,
      map: FALLBACK.map.slice(),
      fallback: true,
      attempts: attempts
    };
  }

  function walkPath(st, tx, ty) {
    if (st.px === tx && st.py === ty) return [];
    if (isWall(st, tx, ty)) return null;
    if (crateAt(st.crates, tx, ty) >= 0) return null;
    var w = st.w;
    var h = st.h;
    var seen = new Int32Array(w * h);
    var q = [st.px, st.py];
    var qi = 0;
    var startId = st.py * w + st.px;
    seen[startId] = 1;
    var prev = new Int32Array(w * h);
    var pdir = new Int32Array(w * h);
    prev[startId] = -1;
    var x;
    var y;
    var k;
    var nx;
    var ny;
    var id;
    var nid;
    var found = false;
    while (qi < q.length) {
      x = q[qi++];
      y = q[qi++];
      if (x === tx && y === ty) {
        found = true;
        break;
      }
      for (k = 0; k < 4; k++) {
        nx = x + DX[k];
        ny = y + DY[k];
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        if (st.walls[ny][nx]) continue;
        if (crateAt(st.crates, nx, ny) >= 0) continue;
        nid = ny * w + nx;
        if (seen[nid]) continue;
        seen[nid] = 1;
        prev[nid] = y * w + x;
        pdir[nid] = k;
        q.push(nx, ny);
      }
    }
    if (!found) return null;
    var dirs = [];
    id = ty * w + tx;
    while (id !== startId) {
      dirs.push(pdir[id]);
      id = prev[id];
      if (id < 0) break;
    }
    dirs.reverse();
    return dirs;
  }

  function selfCheck() {
    var st;
    var nxt;
    var i;
    var r;
    var res;

    st = parseLevel([
      "#####",
      "# $ #",
      "# @ #",
      "# . #",
      "#####"
    ]);
    if (tryMove(st, 0, -1)) throw new Error("must not push crate into wall");
    nxt = tryMove(st, 0, 1);
    if (!nxt) throw new Error("walk onto goal");
    if (crateAt(nxt.crates, 2, 1) < 0) throw new Error("walk away must not pull");
    if (nxt.px !== 2 || nxt.py !== 3) throw new Error("player walked down");

    nxt = tryMove(st, 1, 0);
    if (!nxt || nxt.px !== 3 || nxt.py !== 2) throw new Error("walk right");
    if (crateAt(nxt.crates, 2, 1) < 0) throw new Error("side step is not a pull");

    st = parseLevel(["#######", "#@$$..#", "#######"]);
    if (tryMove(st, 1, 0)) throw new Error("cannot push two crates");

    st = parseLevel(LEVELS[0].map);
    nxt = tryMove(st, 1, 0);
    if (!nxt || nxt.pushed !== 0) throw new Error("level 1 must push");
    if (!isWon(nxt)) throw new Error("level 1 one push wins");
    if (tryMove(st, -1, 0)) throw new Error("level 1 wall");

    if (LEVELS.length < 12) throw new Error("need 12 levels");
    for (i = 0; i < LEVELS.length; i++) {
      st = parseLevel(LEVELS[i].map);
      r = solveLevel(st, CHECK_CAP);
      if (!r.ok) throw new Error("unsolvable " + i + " " + LEVELS[i].name + (r.timeout ? " timeout" : ""));
    }
    r = solveLevel(parseLevel(FALLBACK.map), CHECK_CAP);
    if (!r.ok) throw new Error("fallback unsolvable");

    res = generateDaily(20260822, 400);
    if (res.fallback) throw new Error("daily seed should generate");
    st = parseLevel(res.map);
    if (st.crates.length !== 3) throw new Error("daily 3 crates");
    if (st.w !== DAILY_W + 2 || st.h !== DAILY_H + 2) throw new Error("daily 6x8 interior");
    r = solveLevel(st, CHECK_CAP);
    if (!r.ok) throw new Error("daily seed unsolvable");
    res = generateDaily(19990101, 400);
    st = parseLevel(res.map);
    r = solveLevel(st, CHECK_CAP);
    if (!r.ok) throw new Error("daily alt seed unsolvable");

    st = parseLevel(LEVELS[1].map);
    if (walkPath(st, 1, 1) === null) throw new Error("path around crate");
    if (walkPath(st, 3, 2) !== null) throw new Error("must not path onto crate");

    return true;
  }

  if (typeof document === "undefined") {
    selfCheck();
    console.log("soko-box ok", LEVELS.length, "levels");
    return;
  }

  var canvas = document.getElementById("c");
  var ctx = canvas.getContext("2d", { alpha: false });
  var overlay = document.getElementById("overlay");
  var panel = document.getElementById("panel");
  var ovKicker = document.getElementById("ov-kicker");
  var ovTitle = document.getElementById("ov-title");
  var ovLead = document.getElementById("ov-lead");
  var ovOps = document.getElementById("ov-ops");
  var ovBtn = document.getElementById("ov-btn");
  var ovAlt = document.getElementById("ov-alt");
  var stageEl = document.getElementById("stage");
  var stageLabel = document.getElementById("stage-label");
  var crateLabel = document.getElementById("crate-label");
  var stepLabel = document.getElementById("step-label");
  var levelPips = document.getElementById("level-pips");
  var toastEl = document.getElementById("toast");
  var hintEl = document.getElementById("hint");
  var btnMute = document.getElementById("btn-mute");
  var btnUndo = document.getElementById("btn-undo");
  var btnRetry = document.getElementById("btn-retry");
  var btnCamp = document.getElementById("mode-camp");
  var btnDaily = document.getElementById("mode-daily");
  var padEl = document.getElementById("pad");
  var padBtns = {
    up: document.getElementById("btn-up"),
    down: document.getElementById("btn-down"),
    left: document.getElementById("btn-left"),
    right: document.getElementById("btn-right")
  };

  var coarse = window.matchMedia("(pointer: coarse)").matches;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (coarse) {
    hintEl.textContent = "滑动或点邻格 · 十字键走动 · U 撤销";
    padEl.style.display = "grid";
  }

  var view = { dpr: 1, cssW: 1, cssH: 1, ox: 0, oy: 0, cell: 36, pad: 10 };
  var particles = [];
  var motes = [];
  var stars = [];
  var clock = 0;
  var lastTs = 0;
  var toastT = 0;
  var flash = 0;
  var shake = 0;
  var frozen = true;
  var overlayKind = "title";
  var mode = "campaign";
  var pendingDir = -1;
  var pathQueue = [];
  var dailyCache = null;
  var dailyStamp = "";

  var G = {
    name: "",
    index: 0,
    initial: null,
    st: null,
    faceX: 1,
    faceY: 0,
    anim: null,
    undo: [],
    steps: 0,
    won: false,
    winT: 0
  };

  var SFX = {
    ctx: null,
    master: null,
    muted: false,
    ensure: function () {
      if (!this.ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.72;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
    },
    beep: function (freq, dur, type, vol, slide, delay) {
      if (!this.ctx || this.muted) return;
      var t = this.ctx.currentTime + (delay || 0);
      var o = this.ctx.createOscillator();
      var g = this.ctx.createGain();
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
    noise: function (dur, vol) {
      if (!this.ctx || this.muted) return;
      var n = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
      var buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      var data = buf.getChannelData(0);
      var i;
      for (i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
      var src = this.ctx.createBufferSource();
      src.buffer = buf;
      var g = this.ctx.createGain();
      g.gain.value = vol;
      src.connect(g);
      g.connect(this.master);
      src.start();
    },
    step: function () {
      this.ensure();
      this.beep(640, 0.045, "square", 0.026, 280);
    },
    push: function () {
      this.ensure();
      this.beep(170, 0.1, "sine", 0.07, 80);
      this.beep(390, 0.08, "triangle", 0.03, 180);
      this.noise(0.045, 0.045);
    },
    bump: function () {
      this.ensure();
      this.beep(130, 0.08, "square", 0.04, 70);
    },
    seat: function () {
      this.ensure();
      this.beep(523, 0.12, "sine", 0.07, 784);
      this.beep(784, 0.16, "triangle", 0.045, 1046);
    },
    undo: function () {
      this.ensure();
      this.beep(420, 0.07, "sine", 0.035, 240);
    },
    win: function () {
      this.ensure();
      this.beep(523, 0.12, "sine", 0.07, 659, 0);
      this.beep(659, 0.14, "sine", 0.07, 784, 0.09);
      this.beep(784, 0.16, "sine", 0.08, 1046, 0.2);
      this.beep(1046, 0.28, "triangle", 0.08, 1318, 0.34);
    },
    start: function () {
      this.ensure();
      this.beep(220, 0.14, "sine", 0.05, 440);
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === "1") SFX.muted = true;
  } catch (_) { /* ignore */ }

  function loadProgress() {
    var out = { n: 0, daily: "" };
    try {
      var raw = localStorage.getItem(CLEAR_KEY);
      if (!raw) return out;
      if (raw.charAt(0) === "{") {
        var o = JSON.parse(raw);
        if (o && typeof o.n === "number") out.n = o.n | 0;
        if (o && typeof o.daily === "string") out.daily = o.daily;
      } else {
        out.n = parseInt(raw, 10) || 0;
      }
    } catch (_) { /* ignore */ }
    out.n = clamp(out.n, 0, LEVELS.length);
    return out;
  }

  function saveProgress(p) {
    try {
      localStorage.setItem(CLEAR_KEY, JSON.stringify({ n: p.n, daily: p.daily || "" }));
    } catch (_) { /* ignore */ }
  }

  var progress = loadProgress();

  function syncMuteBtn() {
    btnMute.textContent = SFX.muted ? "静" : "声";
    btnMute.classList.toggle("muted", SFX.muted);
    btnMute.setAttribute("aria-label", SFX.muted ? "开启声音" : "静音");
  }
  syncMuteBtn();

  function setMuted(m) {
    SFX.muted = m;
    if (SFX.master) SFX.master.gain.value = m ? 0 : 0.72;
    syncMuteBtn();
    try {
      localStorage.setItem(MUTE_KEY, m ? "1" : "0");
    } catch (_) { /* ignore */ }
  }

  function showToast(text, warn) {
    toastEl.textContent = text;
    toastEl.classList.toggle("warn", !!warn);
    toastEl.classList.remove("hidden");
    toastT = 1.6;
  }

  function burst(x, y, rgb, n, spd) {
    var i;
    var a;
    var s;
    for (i = 0; i < n; i++) {
      a = Math.random() * TAU;
      s = spd * (0.25 + Math.random());
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        t: 0,
        life: 0.28 + Math.random() * 0.4,
        rgb: rgb,
        r: 1.1 + Math.random() * 2.2
      });
    }
  }

  function seedStars() {
    stars.length = 0;
    motes.length = 0;
    var i;
    for (i = 0; i < 42; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        r: 0.4 + Math.random() * 1.1,
        a: 0.14 + Math.random() * 0.4,
        p: Math.random() * TAU
      });
    }
    for (i = 0; i < 16; i++) {
      motes.push({
        x: Math.random(),
        y: Math.random(),
        s: 8 + Math.random() * 14,
        v: 4 + Math.random() * 9,
        p: Math.random() * TAU
      });
    }
  }
  seedStars();

  function hideOverlay() {
    overlay.classList.add("hidden");
    overlay.setAttribute("aria-hidden", "true");
    frozen = false;
    overlayKind = "";
  }

  function showOverlay(kind) {
    overlayKind = kind;
    frozen = true;
    pendingDir = -1;
    pathQueue.length = 0;
    overlay.classList.remove("hidden");
    overlay.setAttribute("aria-hidden", "false");
    panel.classList.remove("win");
    ovAlt.hidden = true;
    if (kind === "title") {
      ovKicker.textContent = "SOKO";
      ovTitle.textContent = "箱迷";
      ovLead.innerHTML = "推箱入位，不能拉。<br />一次只推一箱，撞墙或顶两箱都走不动。";
      ovOps.textContent = "方向键 / WASD · 滑动或点格 · U 撤销 · R 重开 · M 静音";
      ovBtn.textContent = "开推";
    } else if (kind === "win") {
      panel.classList.add("win");
      ovKicker.textContent = "CLEAR";
      ovTitle.textContent = "入位了";
      if (mode === "daily") {
        ovLead.innerHTML = todayParts().label + " 的三箱都压上印记了。";
        ovOps.textContent = "明日再来一局新图 · R 重开今日";
        ovBtn.textContent = "回关卡";
        ovAlt.hidden = false;
        ovAlt.textContent = "重开";
      } else if (G.index >= LEVELS.length - 1) {
        ovLead.innerHTML = "十二关印记全亮。仓库门缝里漏出金光。";
        ovOps.textContent = "可点进度点回看 · 或开每日";
        ovBtn.textContent = "再来一轮";
        ovAlt.hidden = false;
        ovAlt.textContent = "每日";
      } else {
        ovLead.innerHTML = "第 " + (G.index + 1) + " 关 · " + G.name + " · " + G.steps + " 步";
        ovOps.textContent = "U 仍可撤销本关 · 下一关继续";
        ovBtn.textContent = "下一关";
        ovAlt.hidden = false;
        ovAlt.textContent = "重开";
      }
    }
  }

  function resize() {
    var wrap = canvas.parentElement;
    var cssW = Math.max(1, wrap.clientWidth);
    var cssH = Math.max(1, wrap.clientHeight);
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    view.cssW = cssW;
    view.cssH = cssH;
    view.dpr = dpr;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    if (G.st) layoutBoard();
  }

  function layoutBoard() {
    var st = G.st;
    if (!st) return;
    var pad = 18;
    var cell = Math.min(
      (view.cssW - pad * 2) / st.w,
      (view.cssH - pad * 2) / st.h
    );
    cell = Math.max(18, Math.min(72, cell));
    view.cell = cell;
    view.pad = cell * 0.1;
    view.ox = (view.cssW - st.w * cell) / 2;
    view.oy = (view.cssH - st.h * cell) / 2;
  }

  function cellCenter(x, y) {
    return {
      x: view.ox + (x + 0.5) * view.cell,
      y: view.oy + (y + 0.5) * view.cell
    };
  }

  function pickDaily() {
    var day = todayParts();
    if (dailyCache && dailyStamp === day.key) return dailyCache;
    var gen = generateDaily(day.seed, GEN_CAP);
    dailyCache = gen;
    dailyStamp = day.key;
    return gen;
  }

  function loadLevel(spec, index) {
    var parsed = parseLevel(spec.map);
    G.name = spec.name;
    G.index = index == null ? G.index : index;
    G.initial = spec;
    G.st = parsed;
    G.faceX = 1;
    G.faceY = 0;
    G.anim = null;
    G.undo = [];
    G.steps = 0;
    G.won = false;
    G.winT = 0;
    pendingDir = -1;
    pathQueue.length = 0;
    layoutBoard();
    syncHud();
  }

  function resumeCampaignIndex() {
    return progress.n >= LEVELS.length ? 0 : progress.n;
  }

  function startCampaign(index) {
    mode = "campaign";
    btnCamp.setAttribute("aria-pressed", "true");
    btnDaily.setAttribute("aria-pressed", "false");
    if (index == null) index = resumeCampaignIndex();
    index = clamp(index, 0, LEVELS.length - 1);
    loadLevel(LEVELS[index], index);
    hintEl.textContent = coarse
      ? "滑动或点邻格 · 十字键走动 · U 撤销"
      : "推箱入位 · 不能拉 · U 撤销 · R 重开";
  }

  function startDaily() {
    mode = "daily";
    btnCamp.setAttribute("aria-pressed", "false");
    btnDaily.setAttribute("aria-pressed", "true");
    var gen = pickDaily();
    loadLevel(gen, -1);
    var day = todayParts();
    hintEl.textContent = gen.fallback
      ? "今日图改用闲局 · " + day.label
      : "每日 · " + day.label + " · 三箱";
    if (gen.fallback) showToast("今日改用闲局", false);
  }

  function syncHud() {
    var st = G.st;
    if (!st) return;
    var seated = seatedCount(st);
    var total = st.crates.length;
    crateLabel.textContent = "入位 " + seated + " / " + total;
    stepLabel.textContent = G.steps + " 步";
    if (mode === "daily") {
      stageLabel.textContent = "每日 · " + todayParts().label;
      levelPips.innerHTML = "";
    } else {
      stageLabel.textContent = "关卡 " + (G.index + 1) + " / " + LEVELS.length + "　" + G.name;
      var html = "";
      var i;
      var unlocked;
      var cls;
      for (i = 0; i < LEVELS.length; i++) {
        unlocked = i <= progress.n;
        cls = "pip";
        if (i < progress.n) cls += " on";
        if (i === G.index) cls += " now";
        html += "<button type=\"button\" class=\"" + cls + "\" data-lv=\"" + i + "\"" +
          (unlocked ? "" : " disabled") +
          " aria-label=\"关卡 " + (i + 1) + "\"" +
          " title=\"" + LEVELS[i].name + "\"></button>";
      }
      levelPips.innerHTML = html;
    }
    btnUndo.disabled = G.undo.length === 0 || G.won;
  }

  function snapshot() {
    return {
      st: cloneState(G.st),
      faceX: G.faceX,
      faceY: G.faceY,
      steps: G.steps
    };
  }

  function applySnap(s) {
    G.st = cloneState(s.st);
    G.faceX = s.faceX;
    G.faceY = s.faceY;
    G.steps = s.steps;
    G.anim = null;
    G.won = false;
    G.winT = 0;
  }

  function visState() {
    var st = G.st;
    var px = st.px;
    var py = st.py;
    var crates = st.crates;
    var u;
    if (G.anim) {
      u = ease(G.anim.t / G.anim.dur);
      if (reduceMotion) u = 1;
      px = lerp(G.anim.px0, G.anim.px1, u);
      py = lerp(G.anim.py0, G.anim.py1, u);
      crates = G.anim.crates0.map(function (c, i) {
        var d = G.anim.crates1[i];
        return { x: lerp(c.x, d.x, u), y: lerp(c.y, d.y, u) };
      });
    }
    return { px: px, py: py, crates: crates };
  }

  function roundRect(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawFloor(x, y, alt) {
    var s = view.cell;
    var px = view.ox + x * s;
    var py = view.oy + y * s;
    ctx.fillStyle = alt ? "#0c0a14" : "#100e18";
    ctx.fillRect(px, py, s + 0.5, s + 0.5);
    ctx.strokeStyle = "rgba(255,227,107,0.05)";
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 0.5, py + 0.5, s - 1, s - 1);
  }

  function drawGoal(x, y, filled, t) {
    var c = cellCenter(x, y);
    var pulse = 0.55 + Math.sin(t * 3.1 + x * 0.7 + y) * 0.45;
    var r = view.cell * 0.28 * (filled ? 1 : 0.72 + pulse * 0.18);
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.35, 0, TAU);
    ctx.fillStyle = filled
      ? "rgba(255,227,107,0.16)"
      : "rgba(0,240,255," + (0.1 + pulse * 0.08) + ")";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.strokeStyle = filled
      ? "rgba(255,227,107,0.9)"
      : "rgba(0,240,255," + (0.5 + pulse * 0.4) + ")";
    ctx.lineWidth = 1.8;
    ctx.shadowColor = filled ? "rgba(255,227,107,0.7)" : "rgba(0,240,255,0.7)";
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.42);
    ctx.lineTo(0, r * 0.42);
    ctx.moveTo(-r * 0.42, 0);
    ctx.lineTo(r * 0.42, 0);
    ctx.stroke();
    ctx.restore();
  }

  function drawWall(x, y) {
    var s = view.cell;
    var px = view.ox + x * s;
    var py = view.oy + y * s;
    var z = s * 0.14;
    var inset = s * 0.06;
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(px + inset, py + inset + z, s - inset * 2, s - inset * 2);
    roundRect(px + inset, py + inset - z * 0.2, s - inset * 2, s - inset * 2, s * 0.12);
    var g = ctx.createLinearGradient(px, py, px, py + s);
    g.addColorStop(0, "#3a3348");
    g.addColorStop(0.45, "#262033");
    g.addColorStop(1, "#16101f");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,176,32,0.28)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,227,107,0.16)";
    ctx.beginPath();
    ctx.moveTo(px + inset + 3, py + inset + 4);
    ctx.lineTo(px + s - inset - 4, py + inset + 4);
    ctx.stroke();
  }

  function drawCrate(x, y, on, t) {
    var c = cellCenter(x, y);
    var s = view.cell;
    var z = s * 0.16;
    var half = s * 0.34;
    var bob = reduceMotion ? 0 : Math.sin(t * 2.2 + x + y) * 0.8;
    var top = on ? "#ffe9a0" : "#ffb020";
    var side = on ? "#b8862a" : "#a35a10";
    var edge = on ? "rgba(255,227,107,0.95)" : "rgba(255,140,40,0.8)";
    ctx.save();
    ctx.translate(c.x, c.y + bob);
    ctx.fillStyle = "rgba(0,0,0,0.38)";
    ctx.beginPath();
    ctx.ellipse(0, half * 0.85, half * 0.95, half * 0.32, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = side;
    roundRect(-half, -half + z * 0.4, half * 2, half * 2, s * 0.08);
    ctx.fill();
    ctx.shadowColor = on ? "rgba(255,227,107,0.55)" : "rgba(255,140,40,0.4)";
    ctx.shadowBlur = 14;
    ctx.fillStyle = top;
    roundRect(-half, -half - z * 0.15, half * 2, half * 2 - z * 0.2, s * 0.1);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = edge;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.strokeStyle = on ? "rgba(5,3,12,0.45)" : "rgba(80,30,0,0.45)";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-half * 0.45, -half * 0.45);
    ctx.lineTo(half * 0.45, half * 0.35);
    ctx.moveTo(half * 0.45, -half * 0.45);
    ctx.lineTo(-half * 0.45, half * 0.35);
    ctx.stroke();
    if (on) {
      ctx.beginPath();
      ctx.arc(0, -z * 0.1, half * 0.22, 0, TAU);
      ctx.strokeStyle = "rgba(0,240,255,0.7)";
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPlayer(x, y, fx, fy, t) {
    var c = cellCenter(x, y);
    var s = view.cell;
    var bob = reduceMotion ? 0 : Math.sin(t * 6.2) * 1.3;
    var r = s * 0.2;
    ctx.save();
    ctx.translate(c.x, c.y + bob);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(0, r * 1.35, r * 1.35, r * 0.45, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#7af6ff";
    ctx.shadowColor = "rgba(0,240,255,0.75)";
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.ellipse(0, r * 0.15, r * 0.82, r * 1.12, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(fx * r * 0.12, -r * 1.35, r * 0.58, 0, TAU);
    ctx.fillStyle = "#e8ffff";
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#05030c";
    ctx.beginPath();
    ctx.arc(fx * r * 0.28 - r * 0.16, -r * 1.42, 1.2, 0, TAU);
    ctx.arc(fx * r * 0.28 + r * 0.16, -r * 1.42, 1.2, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#00f0ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(fx * r * 0.9, fy * r * 0.15);
    ctx.lineTo(fx * r * 1.7, fy * r * 0.55);
    ctx.stroke();
    ctx.restore();
  }

  function drawWorld() {
    var w = view.cssW;
    var h = view.cssH;
    var st = G.st;
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    ctx.fillStyle = "#05030c";
    ctx.fillRect(0, 0, w, h);

    var g1 = ctx.createRadialGradient(w * 0.28, h * 0.08, 10, w * 0.28, h * 0.08, w * 0.7);
    g1.addColorStop(0, "rgba(255,176,32,0.12)");
    g1.addColorStop(1, "rgba(255,176,32,0)");
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, w, h);
    var g2 = ctx.createRadialGradient(w * 0.82, h * 0.14, 10, w * 0.82, h * 0.14, w * 0.6);
    g2.addColorStop(0, "rgba(0,240,255,0.08)");
    g2.addColorStop(1, "rgba(0,240,255,0)");
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, w, h);

    var i;
    var s;
    var m;
    var y;
    for (i = 0; i < stars.length; i++) {
      s = stars[i];
      ctx.fillStyle = "rgba(230,236,255," + (s.a * (0.55 + Math.sin(clock * 1.3 + s.p) * 0.45)) + ")";
      ctx.beginPath();
      ctx.arc(s.x * w, s.y * h, s.r, 0, TAU);
      ctx.fill();
    }
    for (i = 0; i < motes.length; i++) {
      m = motes[i];
      y = ((m.y * h + clock * m.v) % (h + 40)) - 20;
      ctx.fillStyle = "rgba(255,176,32,0.08)";
      ctx.beginPath();
      ctx.arc(m.x * w, y, m.s * 0.12, 0, TAU);
      ctx.fill();
    }

    if (!st) return;

    var shx = 0;
    var shy = 0;
    if (shake > 0 && !reduceMotion) {
      shx = (Math.random() - 0.5) * shake;
      shy = (Math.random() - 0.5) * shake;
    }
    ctx.save();
    ctx.translate(shx, shy);

    var vis = visState();
    var x;
    var crate;
    var on;
    for (y = 0; y < st.h; y++) {
      for (x = 0; x < st.w; x++) {
        if (st.walls[y][x]) continue;
        drawFloor(x, y, ((x + y) & 1) === 0);
      }
    }
    for (y = 0; y < st.h; y++) {
      for (x = 0; x < st.w; x++) {
        if (st.goals[y][x]) {
          on = crateAt(st.crates, x, y) >= 0;
          drawGoal(x, y, on, clock);
        }
      }
    }
    for (y = 0; y < st.h; y++) {
      for (x = 0; x < st.w; x++) {
        if (st.walls[y][x]) drawWall(x, y);
      }
    }
    for (i = 0; i < vis.crates.length; i++) {
      crate = vis.crates[i];
      on = st.goals[Math.round(crate.y)] && st.goals[Math.round(crate.y)][Math.round(crate.x)];
      drawCrate(crate.x, crate.y, on, clock);
    }
    drawPlayer(vis.px, vis.py, G.faceX, G.faceY, clock);

    for (i = particles.length - 1; i >= 0; i--) {
      s = particles[i];
      ctx.fillStyle = "rgba(" + s.rgb + "," + (1 - s.t / s.life) + ")";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, TAU);
      ctx.fill();
    }

    if (flash > 0) {
      ctx.fillStyle = "rgba(255,227,107," + (flash * 0.18) + ")";
      ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();
  }

  function markCleared() {
    if (mode === "daily") {
      progress.daily = todayParts().key;
      saveProgress(progress);
    } else {
      if (G.index + 1 > progress.n) {
        progress.n = G.index + 1;
        saveProgress(progress);
      }
    }
  }

  function finishWin() {
    if (overlayKind === "win") return;
    markCleared();
    SFX.win();
    stageEl.classList.remove("win-flash");
    void stageEl.offsetWidth;
    stageEl.classList.add("win-flash");
    showOverlay("win");
    syncHud();
  }

  function afterMove(prevSeated, prevCrates, next) {
    var nowSeated = seatedCount(next);
    if (nowSeated > prevSeated) {
      SFX.seat();
      flash = 0.35;
      var i;
      var c;
      var p;
      for (i = 0; i < next.crates.length; i++) {
        c = next.crates[i];
        if (next.goals[c.y][c.x] && crateAt(prevCrates, c.x, c.y) < 0) {
          p = cellCenter(c.x, c.y);
          burst(p.x, p.y, "255,227,107", 14, 80);
        }
      }
    }
    if (isWon(next)) {
      G.won = true;
      G.winT = WIN_HOLD / 1000;
      pathQueue.length = 0;
      pendingDir = -1;
    }
  }

  function beginMove(dx, dy) {
    if (frozen || G.won || G.anim) return false;
    var prev = G.st;
    var next = tryMove(prev, dx, dy);
    if (!next) {
      G.faceX = dx;
      G.faceY = dy;
      SFX.bump();
      shake = 5;
      return false;
    }
    G.undo.push(snapshot());
    G.faceX = dx;
    G.faceY = dy;
    G.steps += 1;
    var prevSeated = seatedCount(prev);
    var dur = reduceMotion ? 1 : MOVE_MS / 1000;
    G.anim = {
      t: 0,
      dur: dur,
      px0: prev.px,
      py0: prev.py,
      px1: next.px,
      py1: next.py,
      crates0: cloneCrates(prev.crates),
      crates1: cloneCrates(next.crates),
      next: next,
      prevSeated: prevSeated,
      pushed: next.pushed
    };
    if (next.pushed >= 0) SFX.push();
    else SFX.step();
    return true;
  }

  function moveByDir(k) {
    if (k < 0 || k > 3) return;
    beginMove(DX[k], DY[k]);
  }

  function dirFromName(name) {
    if (name === "left") return 1;
    if (name === "right") return 0;
    if (name === "up") return 3;
    if (name === "down") return 2;
    return -1;
  }

  function tryDir(name) {
    if (frozen && overlayKind) return;
    if (G.won) return;
    var k = dirFromName(name);
    if (k < 0) return;
    if (G.anim) {
      pendingDir = k;
      pathQueue.length = 0;
      return;
    }
    moveByDir(k);
  }

  function undoMove() {
    if (frozen && overlayKind === "title") return;
    if (!G.undo.length) return;
    if (G.won && overlayKind === "win") hideOverlay();
    applySnap(G.undo.pop());
    pathQueue.length = 0;
    pendingDir = -1;
    SFX.undo();
    syncHud();
  }

  function restartLevel() {
    if (!G.initial) return;
    if (overlayKind === "title") return;
    loadLevel(G.initial, G.index);
    if (overlayKind) hideOverlay();
    SFX.start();
    showToast("重开", false);
  }

  function nextAfterWin() {
    if (mode === "daily") {
      hideOverlay();
      startCampaign(resumeCampaignIndex());
      return;
    }
    if (G.index >= LEVELS.length - 1) {
      hideOverlay();
      startCampaign(0);
      return;
    }
    hideOverlay();
    startCampaign(G.index + 1);
    SFX.start();
  }

  function handleOverlayPrimary() {
    if (overlayKind === "title") {
      SFX.start();
      hideOverlay();
      if (mode === "daily") startDaily();
      else startCampaign(resumeCampaignIndex());
      return;
    }
    if (overlayKind === "win") nextAfterWin();
  }

  function handleOverlayAlt() {
    if (overlayKind !== "win") return;
    if (mode === "daily") {
      hideOverlay();
      restartLevel();
      return;
    }
    if (G.index >= LEVELS.length - 1) {
      hideOverlay();
      startDaily();
      return;
    }
    hideOverlay();
    restartLevel();
  }

  function cellFromPointer(clientX, clientY) {
    var rect = canvas.getBoundingClientRect();
    var x = clientX - rect.left;
    var y = clientY - rect.top;
    if (!G.st) return null;
    var cx = Math.floor((x - view.ox) / view.cell);
    var cy = Math.floor((y - view.oy) / view.cell);
    if (cx < 0 || cy < 0 || cx >= G.st.w || cy >= G.st.h) return null;
    return { x: cx, y: cy };
  }

  function clickCell(cx, cy) {
    if (frozen || G.won || G.anim) return;
    var st = G.st;
    var dx = cx - st.px;
    var dy = cy - st.py;
    if (Math.abs(dx) + Math.abs(dy) === 1) {
      beginMove(dx, dy);
      return;
    }
    var ci = crateAt(st.crates, cx, cy);
    if (ci >= 0) {
      var k;
      var sx;
      var sy;
      for (k = 0; k < 4; k++) {
        sx = cx - DX[k];
        sy = cy - DY[k];
        if (sx === st.px && sy === st.py) {
          beginMove(DX[k], DY[k]);
          return;
        }
      }
      showToast("绕到箱后才能推", true);
      SFX.bump();
      return;
    }
    var dirs = walkPath(st, cx, cy);
    if (!dirs || !dirs.length) {
      SFX.bump();
      return;
    }
    pathQueue = dirs.slice();
    moveByDir(pathQueue.shift());
  }

  var pointer = { down: false, id: null, x: 0, y: 0, sx: 0, sy: 0, moved: false };

  function onPointerDown(e) {
    if (e.button != null && e.button !== 0) return;
    SFX.ensure();
    if (frozen) return;
    pointer.down = true;
    pointer.id = e.pointerId;
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.sx = e.clientX;
    pointer.sy = e.clientY;
    pointer.moved = false;
    try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
  }

  function onPointerMove(e) {
    if (!pointer.down || pointer.id !== e.pointerId) return;
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    if (Math.abs(e.clientX - pointer.sx) > 6 || Math.abs(e.clientY - pointer.sy) > 6) {
      pointer.moved = true;
    }
  }

  function onPointerUp(e) {
    if (!pointer.down || (pointer.id != null && e.pointerId !== pointer.id)) return;
    pointer.down = false;
    var dx = pointer.x - pointer.sx;
    var dy = pointer.y - pointer.sy;
    var adx = Math.abs(dx);
    var ady = Math.abs(dy);
    if (pointer.moved && (adx >= SWIPE_MIN || ady >= SWIPE_MIN)) {
      if (adx > ady) tryDir(dx > 0 ? "right" : "left");
      else tryDir(dy > 0 ? "down" : "up");
    } else if (!pointer.moved) {
      var cell = cellFromPointer(pointer.sx, pointer.sy);
      if (cell) clickCell(cell.x, cell.y);
    }
    pointer.id = null;
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });

  function bindPad(name, el) {
    function down(ev) {
      ev.preventDefault();
      SFX.ensure();
      el.classList.add("held");
      tryDir(name);
    }
    function up() { el.classList.remove("held"); }
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointerleave", up);
    el.addEventListener("pointercancel", up);
  }
  bindPad("up", padBtns.up);
  bindPad("down", padBtns.down);
  bindPad("left", padBtns.left);
  bindPad("right", padBtns.right);

  var KEY_DIR = {
    ArrowLeft: "left",
    ArrowRight: "right",
    ArrowUp: "up",
    ArrowDown: "down",
    KeyA: "left",
    KeyD: "right",
    KeyW: "up",
    KeyS: "down"
  };

  window.addEventListener("keydown", function (e) {
    if (e.repeat && (e.code === "KeyU" || e.code === "KeyR" || e.code === "KeyM")) return;
    SFX.ensure();
    if (e.code === "KeyM") {
      e.preventDefault();
      setMuted(!SFX.muted);
      return;
    }
    if (overlayKind === "title") {
      if (e.code === "Enter" || e.code === "Space" || e.code === "KeyR") {
        e.preventDefault();
        handleOverlayPrimary();
      }
      if (KEY_DIR[e.code]) e.preventDefault();
      return;
    }
    if (e.code === "KeyU" || e.code === "KeyZ") {
      e.preventDefault();
      undoMove();
      return;
    }
    if (e.code === "KeyR") {
      e.preventDefault();
      restartLevel();
      return;
    }
    if (overlayKind === "win") {
      if (e.code === "Enter" || e.code === "Space") {
        e.preventDefault();
        handleOverlayPrimary();
      }
      if (KEY_DIR[e.code]) e.preventDefault();
      return;
    }
    var d = KEY_DIR[e.code];
    if (d) {
      e.preventDefault();
      tryDir(d);
    }
  });

  ovBtn.addEventListener("click", function () {
    SFX.ensure();
    handleOverlayPrimary();
  });
  ovAlt.addEventListener("click", function () {
    SFX.ensure();
    handleOverlayAlt();
  });
  btnMute.addEventListener("click", function () {
    SFX.ensure();
    setMuted(!SFX.muted);
  });
  btnUndo.addEventListener("click", function () {
    SFX.ensure();
    undoMove();
  });
  btnRetry.addEventListener("click", function () {
    SFX.ensure();
    if (overlayKind === "title") handleOverlayPrimary();
    else restartLevel();
  });
  btnCamp.addEventListener("click", function () {
    SFX.ensure();
    if (mode === "campaign" && overlayKind !== "title") return;
    if (overlayKind === "title") {
      mode = "campaign";
      btnCamp.setAttribute("aria-pressed", "true");
      btnDaily.setAttribute("aria-pressed", "false");
      return;
    }
    hideOverlay();
    startCampaign(resumeCampaignIndex());
  });
  btnDaily.addEventListener("click", function () {
    SFX.ensure();
    if (mode === "daily" && overlayKind !== "title") return;
    if (overlayKind === "title") {
      mode = "daily";
      btnCamp.setAttribute("aria-pressed", "false");
      btnDaily.setAttribute("aria-pressed", "true");
      return;
    }
    hideOverlay();
    startDaily();
  });
  levelPips.addEventListener("click", function (e) {
    var t = e.target;
    if (!t || !t.getAttribute) return;
    var lv = t.getAttribute("data-lv");
    if (lv == null) return;
    SFX.ensure();
    var n = parseInt(lv, 10);
    if (n > progress.n) return;
    if (overlayKind === "title") return;
    hideOverlay();
    startCampaign(n);
  });

  window.addEventListener("resize", resize);
  if (window.ResizeObserver) {
    new ResizeObserver(resize).observe(canvas.parentElement);
  }

  function tick(dt) {
    clock += dt;
    if (toastT > 0) {
      toastT -= dt;
      if (toastT <= 0) toastEl.classList.add("hidden");
    }
    if (shake > 0) {
      shake -= dt * 28;
      if (shake < 0) shake = 0;
    }
    if (flash > 0) {
      flash -= dt * 2.4;
      if (flash < 0) flash = 0;
    }
    var i;
    var p;
    for (i = particles.length - 1; i >= 0; i--) {
      p = particles[i];
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 40 * dt;
      if (p.t >= p.life) particles.splice(i, 1);
    }
    if (G.anim) {
      G.anim.t += dt;
      if (G.anim.t >= G.anim.dur) {
        var anim = G.anim;
        G.st = anim.next;
        G.anim = null;
        afterMove(anim.prevSeated, anim.crates0, G.st);
        syncHud();
        if (!G.won) {
          if (pathQueue.length) moveByDir(pathQueue.shift());
          else if (pendingDir >= 0) {
            var d = pendingDir;
            pendingDir = -1;
            moveByDir(d);
          }
        }
      }
    }
    if (G.won && overlayKind !== "win") {
      G.winT -= dt;
      if (G.winT <= 0) finishWin();
    }
  }

  function frame(ts) {
    if (!lastTs) lastTs = ts;
    var dt = (ts - lastTs) / 1000;
    lastTs = ts;
    if (dt > 0.08) dt = 0.08;
    tick(dt);
    drawWorld();
    requestAnimationFrame(frame);
  }

  startCampaign(resumeCampaignIndex());
  resize();
  showOverlay("title");
  requestAnimationFrame(frame);
})();
