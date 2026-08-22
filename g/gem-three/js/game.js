'use strict';

(function () {
  const N = 8;
  const COLORS = 6;
  const NONE = 0;
  const HS = 1;
  const VS = 2;
  const BOMB = 3;
  const MOVES = 30;
  const TIME = 60;
  const BEST_KEY = 'playbox-gem-three-best';
  const MUTE_KEY = 'playbox-gem-three-mute';
  const MODE_KEY = 'playbox-gem-three-mode';
  const AUTO_SPEED_KEY = 'playbox-gem-three-auto-speed';
  const AUTO_DELAY = [0, 0.42, 0.2, 0.07, 0];
  const AUTO_SPEED_NAME = ['', '慢', '中', '快', '极快'];
  const TAU = Math.PI * 2;
  const STEP = 1 / 60;
  const SWAP_T = 0.12;
  const SNAP_T = 0.1;
  const FLASH_T = 0.07;
  const POP_T = 0.13;
  const GRAV = 32;
  const COMBO_WORD = ['', '', '连消', '三连', '潮了', '爆了', '狂潮', '炸翻', '通天'];

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function easeOut(t) {
    return 1 - (1 - t) * (1 - t);
  }
  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function irand(n) {
    return (Math.random() * n) | 0;
  }
  function key(r, c) {
    return r * N + c;
  }
  function rk(k) {
    return (k / N) | 0;
  }
  function ck(k) {
    return k % N;
  }

  function cellColor(cell) {
    if (!cell || cell.dead || cell.spec === BOMB) return -1;
    return cell.color;
  }

  function findGroups(board) {
    const groups = [];
    for (let r = 0; r < N; r++) {
      let c = 0;
      while (c < N) {
        const col = cellColor(board[r][c]);
        if (col < 0) {
          c += 1;
          continue;
        }
        let k = c + 1;
        while (k < N && cellColor(board[r][k]) === col) k += 1;
        if (k - c >= 3) {
          const cells = [];
          for (let i = c; i < k; i++) cells.push({ r: r, c: i });
          groups.push({ dir: 'h', color: col, n: k - c, cells: cells });
        }
        c = k;
      }
    }
    for (let c = 0; c < N; c++) {
      let r = 0;
      while (r < N) {
        const col = cellColor(board[r][c]);
        if (col < 0) {
          r += 1;
          continue;
        }
        let k = r + 1;
        while (k < N && cellColor(board[k][c]) === col) k += 1;
        if (k - r >= 3) {
          const cells = [];
          for (let i = r; i < k; i++) cells.push({ r: i, c: c });
          groups.push({ dir: 'v', color: col, n: k - r, cells: cells });
        }
        r = k;
      }
    }
    return groups;
  }

  function runLenAt(board, r, c) {
    const col = cellColor(board[r][c]);
    if (col < 0) return { h: 0, v: 0 };
    let h = 1;
    let v = 1;
    for (let i = c - 1; i >= 0 && cellColor(board[r][i]) === col; i--) h += 1;
    for (let i = c + 1; i < N && cellColor(board[r][i]) === col; i++) h += 1;
    for (let i = r - 1; i >= 0 && cellColor(board[i][c]) === col; i--) v += 1;
    for (let i = r + 1; i < N && cellColor(board[i][c]) === col; i++) v += 1;
    return { h: h, v: v };
  }

  function isSpecialSwap(a, b) {
    if (!a || !b) return false;
    if (a.spec === BOMB || b.spec === BOMB) return true;
    if (a.spec && b.spec) return true;
    return false;
  }

  function swapCreatesMatch(board, r1, c1, r2, c2) {
    const a = board[r1][c1];
    const b = board[r2][c2];
    if (!a || !b) return false;
    if (isSpecialSwap(a, b)) return true;
    board[r1][c1] = b;
    board[r2][c2] = a;
    const ra = runLenAt(board, r1, c1);
    const rb = runLenAt(board, r2, c2);
    const ok = ra.h >= 3 || ra.v >= 3 || rb.h >= 3 || rb.v >= 3;
    board[r1][c1] = a;
    board[r2][c2] = b;
    return ok;
  }

  function findValidMove(board) {
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (c + 1 < N && swapCreatesMatch(board, r, c, r, c + 1)) {
          return [
            [r, c],
            [r, c + 1]
          ];
        }
        if (r + 1 < N && swapCreatesMatch(board, r, c, r + 1, c)) {
          return [
            [r, c],
            [r + 1, c]
          ];
        }
      }
    }
    return null;
  }

  function cloneLayout(src) {
    const next = [];
    for (let r = 0; r < N; r++) {
      next[r] = [];
      for (let c = 0; c < N; c++) {
        const g = src[r][c];
        next[r][c] = g && !g.dead ? { color: g.color, spec: g.spec || NONE } : null;
      }
    }
    return next;
  }

  function gravityNoFill(b) {
    for (let c = 0; c < N; c++) {
      let write = N - 1;
      for (let r = N - 1; r >= 0; r--) {
        const g = b[r][c];
        if (!g) continue;
        b[r][c] = null;
        b[write][c] = g;
        write -= 1;
      }
    }
  }

  function simulateMove(board, r1, c1, r2, c2) {
    const a = board[r1][c1];
    const b = board[r2][c2];
    if (!a || !b || a.dead || b.dead) return -1;
    const special = isSpecialSwap(a, b);
    if (!special && !swapCreatesMatch(board, r1, c1, r2, c2)) return -1;

    const b2 = cloneLayout(board);
    const tmp = b2[r1][c1];
    b2[r1][c1] = b2[r2][c2];
    b2[r2][c2] = tmp;

    let score = 0;
    let chain = 0;

    if (special) {
      const ga = { r: r1, c: c1, spec: b2[r1][c1].spec, color: b2[r1][c1].color };
      const gb = { r: r2, c: c2, spec: b2[r2][c2].spec, color: b2[r2][c2].color };
      const clear = specialClearSet(b2, ga, gb);
      score += clear.size * 12 + 90;
      chain = 1;
      clear.forEach(function (k) {
        b2[rk(k)][ck(k)] = null;
      });
      gravityNoFill(b2);
    }

    for (let guard = 0; guard < 10; guard++) {
      const groups = findGroups(b2);
      if (!groups.length) break;
      chain += 1;
      const originR = !special && chain === 1 ? r2 : -1;
      const originC = !special && chain === 1 ? c2 : -1;
      const specials = planSpecials(groups, originR, originC);
      const clear = collectClears(b2, groups);
      let maxRun = 0;
      for (let i = 0; i < groups.length; i++) {
        if (groups[i].n > maxRun) maxRun = groups[i].n;
      }
      score += clear.size * 10;
      if (maxRun >= 4) score += 50;
      if (maxRun >= 5) score += 140;
      for (let i = 0; i < specials.length; i++) {
        score += specials[i].spec === BOMB ? 200 : 80;
      }
      if (chain >= 2) score += 120 * (chain - 1);
      clear.forEach(function (k) {
        b2[rk(k)][ck(k)] = null;
      });
      for (let i = 0; i < specials.length; i++) {
        const sp = specials[i];
        b2[sp.r][sp.c] = { color: sp.color, spec: sp.spec };
      }
      gravityNoFill(b2);
    }

    return chain > 0 ? score : -1;
  }

  function pickAutoMove(board) {
    let best = null;
    let bestScore = -1;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (c + 1 < N) {
          const s = simulateMove(board, r, c, r, c + 1);
          if (s > bestScore) {
            bestScore = s;
            best = [
              [r, c],
              [r, c + 1]
            ];
          }
        }
        if (r + 1 < N) {
          const s = simulateMove(board, r, c, r + 1, c);
          if (s > bestScore) {
            bestScore = s;
            best = [
              [r, c],
              [r + 1, c]
            ];
          }
        }
      }
    }
    if (best && bestScore > 0) return best;
    return findValidMove(board);
  }

  function pickSpawn(cells, pr, pc) {
    for (let i = 0; i < cells.length; i++) {
      if (cells[i].r === pr && cells[i].c === pc) return cells[i];
    }
    return cells[(cells.length / 2) | 0];
  }

  function planSpecials(groups, pr, pc) {
    const byKey = Object.create(null);
    for (let i = 0; i < groups.length; i++) {
      const g = groups[i];
      if (g.n < 4) continue;
      const at = pickSpawn(g.cells, pr, pc);
      const spec = g.n >= 5 ? BOMB : g.dir === 'h' ? HS : VS;
      const k = key(at.r, at.c);
      const prev = byKey[k];
      if (!prev) {
        byKey[k] = { r: at.r, c: at.c, spec: spec, color: g.color };
      } else if (spec === BOMB || prev.spec === BOMB) {
        byKey[k].spec = BOMB;
        byKey[k].color = g.n >= prev.spec ? g.color : prev.color;
      } else if (prev.spec !== spec) {
        byKey[k].spec = BOMB;
      }
    }
    const out = [];
    for (const k in byKey) out.push(byKey[k]);
    return out;
  }

  function addStripeDetonations(board, clear) {
    const q = [];
    const seen = new Set();
    clear.forEach(function (k) {
      const g = board[rk(k)][ck(k)];
      if (g && (g.spec === HS || g.spec === VS)) q.push(k);
    });
    while (q.length) {
      const k0 = q.pop();
      if (seen.has(k0)) continue;
      seen.add(k0);
      const g = board[rk(k0)][ck(k0)];
      if (!g) continue;
      if (g.spec === HS) {
        for (let c = 0; c < N; c++) enqueue(key(rk(k0), c));
      } else if (g.spec === VS) {
        for (let r = 0; r < N; r++) enqueue(key(r, ck(k0)));
      }
    }
    function enqueue(k) {
      if (clear.has(k)) {
        const g = board[rk(k)][ck(k)];
        if (g && (g.spec === HS || g.spec === VS) && !seen.has(k)) q.push(k);
        return;
      }
      clear.add(k);
      const g = board[rk(k)][ck(k)];
      if (g && (g.spec === HS || g.spec === VS)) q.push(k);
    }
    return clear;
  }

  function collectClears(board, groups) {
    const clear = new Set();
    for (let i = 0; i < groups.length; i++) {
      const cells = groups[i].cells;
      for (let j = 0; j < cells.length; j++) clear.add(key(cells[j].r, cells[j].c));
    }
    return addStripeDetonations(board, clear);
  }

  function specialClearSet(board, a, b) {
    const clear = new Set();
    function add(r, c) {
      if (r >= 0 && c >= 0 && r < N && c < N) clear.add(key(r, c));
    }
    function addRow(r) {
      for (let c = 0; c < N; c++) add(r, c);
    }
    function addCol(c) {
      for (let r = 0; r < N; r++) add(r, c);
    }
    function addColor(col, asSpec) {
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          const g = board[r][c];
          if (!g || g.spec === BOMB) continue;
          if (g.color === col) {
            add(r, c);
            if (asSpec === HS) addRow(r);
            if (asSpec === VS) addCol(c);
          }
        }
      }
    }
    add(a.r, a.c);
    add(b.r, b.c);
    if (a.spec === BOMB && b.spec === BOMB) {
      for (let r = 0; r < N; r++) addRow(r);
    } else if (a.spec === BOMB || b.spec === BOMB) {
      const other = a.spec === BOMB ? b : a;
      if (other.spec === HS || other.spec === VS) addColor(other.color, other.spec);
      else addColor(other.color, NONE);
    } else {
      if (a.spec === HS) addRow(a.r);
      else if (a.spec === VS) addCol(a.c);
      if (b.spec === HS) addRow(b.r);
      else if (b.spec === VS) addCol(b.c);
    }
    return addStripeDetonations(board, clear);
  }

  function wouldMatchAt(board, r, c, color) {
    if (c >= 2 && cellColor(board[r][c - 1]) === color && cellColor(board[r][c - 2]) === color) return true;
    if (r >= 2 && cellColor(board[r - 1][c]) === color && cellColor(board[r - 2][c]) === color) return true;
    return false;
  }

  function fillNoMatch() {
    const board = [];
    for (let r = 0; r < N; r++) {
      board[r] = [];
      for (let c = 0; c < N; c++) {
        let color = irand(COLORS);
        for (let t = 0; t < 16; t++) {
          color = irand(COLORS);
          if (!wouldMatchAt(board, r, c, color)) break;
        }
        board[r][c] = { color: color, spec: NONE };
      }
    }
    return board;
  }

  function forceMove(board) {
    const A = irand(COLORS);
    let B = irand(COLORS);
    if (B === A) B = (A + 1) % COLORS;
    board[0][0] = { color: A, spec: NONE };
    board[0][1] = { color: A, spec: NONE };
    board[0][2] = { color: B, spec: NONE };
    board[0][3] = { color: A, spec: NONE };
    for (let r = 1; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        if (cellColor(board[r][c]) === A) board[r][c].color = (A + 2 + c) % COLORS;
      }
    }
    if (wouldMatchAt(board, 0, 3, A) && board[0][4] && cellColor(board[0][4]) === A) {
      board[0][4].color = (A + 3) % COLORS;
    }
  }

  function wipeMatches(board) {
    for (let t = 0; t < 24; t++) {
      const gs = findGroups(board);
      if (!gs.length) return;
      const cell = gs[0].cells[gs[0].cells.length >> 1];
      const g = board[cell.r][cell.c];
      g.color = (g.color + 1 + irand(COLORS - 1)) % COLORS;
    }
  }

  function makePlayableBoard() {
    for (let i = 0; i < 80; i++) {
      const b = fillNoMatch();
      wipeMatches(b);
      if (findGroups(b).length) continue;
      if (findValidMove(b)) return b;
    }
    const b = fillNoMatch();
    forceMove(b);
    wipeMatches(b);
    if (!findValidMove(b)) forceMove(b);
    wipeMatches(b);
    return b;
  }

  function permutePlayable(board) {
    const items = [];
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const g = board[r][c];
        items.push({ color: g ? g.color : irand(COLORS), spec: g ? g.spec : NONE });
      }
    }
    for (let t = 0; t < 90; t++) {
      for (let i = items.length - 1; i > 0; i--) {
        const j = irand(i + 1);
        const tmp = items[i];
        items[i] = items[j];
        items[j] = tmp;
      }
      const next = [];
      let p = 0;
      for (let r = 0; r < N; r++) {
        next[r] = [];
        for (let c = 0; c < N; c++) next[r][c] = items[p++];
      }
      if (!findGroups(next).length && findValidMove(next)) return next;
    }
    return makePlayableBoard();
  }

  function runLogicTests() {
    let fail = 0;
    function eq(name, a, b) {
      if (a !== b) {
        console.error('FAIL', name, a, '!=', b);
        fail += 1;
      }
    }
    function ok(name, v) {
      if (!v) {
        console.error('FAIL', name);
        fail += 1;
      }
    }
    function base() {
      const b = [];
      for (let r = 0; r < N; r++) {
        b[r] = [];
        for (let c = 0; c < N; c++) b[r][c] = { color: (c + r) % 3, spec: 0 };
      }
      return b;
    }

    const b3 = base();
    b3[1][1] = { color: 4, spec: 0 };
    b3[1][2] = { color: 4, spec: 0 };
    b3[1][3] = { color: 4, spec: 0 };
    const g3 = findGroups(b3);
    eq('3h count', g3.length, 1);
    eq('3h n', g3[0].n, 3);
    eq('3h dir', g3[0].dir, 'h');

    const b4 = base();
    b4[2][0] = { color: 5, spec: 0 };
    b4[2][1] = { color: 5, spec: 0 };
    b4[2][2] = { color: 5, spec: 0 };
    b4[2][3] = { color: 5, spec: 0 };
    const g4 = findGroups(b4);
    eq('4h n', g4[0].n, 4);
    const sp4 = planSpecials(g4, 2, 2);
    eq('4 stripe', sp4[0].spec, HS);
    eq('4 at origin', sp4[0].c, 2);

    const b5 = base();
    for (let r = 0; r < 5; r++) b5[r][4] = { color: 4, spec: 0 };
    const g5 = findGroups(b5);
    eq('5v n', g5[0].n, 5);
    const sp5 = planSpecials(g5, 2, 4);
    eq('5 bomb', sp5[0].spec, BOMB);

    const b6 = base();
    for (let c = 0; c < 6; c++) b6[5][c] = { color: 4, spec: 0 };
    const sp6 = planSpecials(findGroups(b6), 5, 3);
    eq('6 bomb', sp6[0].spec, BOMB);

    const bs = base();
    bs[0][0] = { color: 4, spec: 0 };
    bs[0][1] = { color: 4, spec: 0 };
    bs[0][2] = { color: 1, spec: 0 };
    bs[0][3] = { color: 4, spec: 0 };
    ok('swap yes', swapCreatesMatch(bs, 0, 2, 0, 3));
    ok('swap no', !swapCreatesMatch(bs, 3, 3, 3, 4));
    ok('has move on 3-near', !!findValidMove(bs));
    ok('sim yes', simulateMove(bs, 0, 2, 0, 3) > 0);
    ok('sim no', simulateMove(bs, 3, 3, 3, 4) < 0);
    const ai3 = pickAutoMove(bs);
    ok('ai 3-near', !!ai3);
    ok(
      'ai 3-near clears',
      ai3 && swapCreatesMatch(bs, ai3[0][0], ai3[0][1], ai3[1][0], ai3[1][1])
    );

    const casc = [];
    for (let r = 0; r < N; r++) {
      casc[r] = [];
      for (let c = 0; c < N; c++) casc[r][c] = { color: (r + c) % 6, spec: 0 };
    }
    const A = 4;
    const Bcol = 5;
    const X = 1;
    casc[0][2] = { color: Bcol, spec: 0 };
    casc[1][2] = { color: Bcol, spec: 0 };
    casc[2][0] = { color: A, spec: 0 };
    casc[2][1] = { color: A, spec: 0 };
    casc[2][2] = { color: X, spec: 0 };
    casc[2][3] = { color: A, spec: 0 };
    casc[2][4] = { color: A, spec: 0 };
    casc[3][2] = { color: Bcol, spec: 0 };
    casc[6][4] = { color: A, spec: 0 };
    casc[6][5] = { color: A, spec: 0 };
    casc[6][6] = { color: X, spec: 0 };
    casc[6][7] = { color: A, spec: 0 };
    const cascScore = simulateMove(casc, 2, 2, 2, 3);
    const simpleScore = simulateMove(casc, 6, 6, 6, 7);
    ok('cascade sim', cascScore > 0);
    ok('simple sim', simpleScore > 0);
    ok('prefer cascade', cascScore > simpleScore);
    const aiC = pickAutoMove(casc);
    ok('ai cascade clears', aiC && swapCreatesMatch(casc, aiC[0][0], aiC[0][1], aiC[1][0], aiC[1][1]));
    ok('ai not random no-swap', aiC && simulateMove(casc, aiC[0][0], aiC[0][1], aiC[1][0], aiC[1][1]) > 0);

    const bb = base();
    bb[4][4] = { color: 0, spec: BOMB };
    ok('bomb swap', swapCreatesMatch(bb, 4, 4, 4, 5));

    const bss = base();
    bss[2][2] = { color: 0, spec: HS };
    bss[2][3] = { color: 1, spec: VS };
    ok('stripe+stripe', swapCreatesMatch(bss, 2, 2, 2, 3));

    const bl = base();
    bl[3][1] = { color: 5, spec: HS };
    bl[3][2] = { color: 5, spec: 0 };
    bl[3][3] = { color: 5, spec: 0 };
    const cl = collectClears(bl, findGroups(bl));
    ok('line blast width', cl.size >= 8);
    ok('row cleared', cl.has(key(3, 0)) && cl.has(key(3, 7)));

    for (let i = 0; i < 20; i++) {
      const play = makePlayableBoard();
      eq('new board matched', findGroups(play).length, 0);
      ok('new board has move', !!findValidMove(play));
      const mv = pickAutoMove(play);
      ok('ai has move', !!mv);
      ok(
        'ai actually clears',
        mv && swapCreatesMatch(play, mv[0][0], mv[0][1], mv[1][0], mv[1][1])
      );
    }

    const tshape = base();
    tshape[4][3] = { color: 5, spec: 0 };
    tshape[4][4] = { color: 5, spec: 0 };
    tshape[4][5] = { color: 5, spec: 0 };
    tshape[3][4] = { color: 5, spec: 0 };
    tshape[5][4] = { color: 5, spec: 0 };
    const tg = findGroups(tshape);
    ok('T has two runs', tg.length >= 2);
    eq('T no special', planSpecials(tg, 4, 4).length, 0);

    if (fail) console.error('logic tests failed:', fail);
    else console.log('gem-three logic ok');
    return fail > 0;
  }

  if (typeof document === 'undefined') {
    const failed = runLogicTests();
    if (typeof process !== 'undefined') process.exit(failed ? 1 : 0);
    return;
  }

  const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let autoOn = false;
  let autoSpeed = 3;
  let autoWait = 0;
  function fastFx() {
    return REDUCE || (autoOn && autoSpeed >= 4);
  }
  const PAL = [
    [255, 227, 107],
    [255, 61, 184],
    [0, 240, 255],
    [125, 255, 107],
    [255, 138, 61],
    [167, 139, 255]
  ];
  const PAL_D = [
    [176, 118, 18],
    [148, 16, 92],
    [8, 110, 132],
    [28, 128, 42],
    [156, 62, 12],
    [72, 48, 168]
  ];
  const PAL_L = [
    [255, 248, 210],
    [255, 180, 226],
    [180, 255, 255],
    [210, 255, 196],
    [255, 214, 170],
    [226, 214, 255]
  ];

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: false });
  const overlay = document.getElementById('overlay');
  const panel = document.getElementById('panel');
  const ovKicker = document.getElementById('ov-kicker');
  const ovTitle = document.getElementById('ov-title');
  const ovLead = document.getElementById('ov-lead');
  const ovOps = document.getElementById('ov-ops');
  const btnMoves = document.getElementById('btn-moves');
  const btnTime = document.getElementById('btn-time');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnAuto = document.getElementById('btn-auto');
  const speedEl = document.getElementById('speed');
  const speedLab = document.getElementById('speed-lab');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const comboEl = document.getElementById('combo');
  const comboBox = document.getElementById('combo-box');
  const modeLabel = document.getElementById('mode-label');
  const resLabel = document.getElementById('res-label');
  const tagLabel = document.getElementById('tag-label');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');

  const OPS_TITLE = '拖或点相邻宝石对换 · 四个成划爆 · 五个成彩爆 · 方向键选格空格交换 · A 自动 · M 静音';
  const OPS_PLAY = '拖相邻对换 · 方向键选格 · 空格交换 · A 自动 · R 重开 · M 静音';

  let W = 1;
  let H = 1;
  let dpr = 1;
  let cell = 48;
  let ox = 0;
  let oy = 0;
  let boardSize = 384;
  let gid = 1;
  let addTok = 0;
  let toastTok = 0;
  let kickTok = 0;
  let hidden = false;
  let acc = 0;
  let lastT = 0;
  let timeWarnTok = -1;

  let board = [];
  let gems = [];
  const particles = [];
  const sparks = [];
  const beams = [];
  const floats = [];
  const rings = [];

  const ptr = {
    down: false,
    id: null,
    x: 0,
    y: 0,
    sx: 0,
    sy: 0,
    from: null,
    swapped: false
  };

  const G = {
    mode: 'title',
    kind: 'moves',
    phase: 'idle',
    phaseT: 0,
    t: 0,
    score: 0,
    bestM: 0,
    bestT: 0,
    left: MOVES,
    chain: 1,
    maxChain: 1,
    idle: 0,
    freeze: 0,
    shake: 0,
    kickX: 0,
    kickY: 0,
    punch: 1,
    flash: 0,
    flashRgb: [255, 227, 107],
    pendingEnd: null,
    originR: 0,
    originC: 0,
    swapValid: false,
    swapSpecial: false,
    swapA: null,
    swapB: null,
    groups: [],
    specials: [],
    clear: new Set(),
    popped: false,
    landedSfx: false,
    hint: null,
    cursorR: 3,
    cursorC: 3,
    selected: null,
    why: '',
    newBest: false
  };

  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function mix(a, b, t) {
    return [
      (a[0] + (b[0] - a[0]) * t + 0.5) | 0,
      (a[1] + (b[1] - a[1]) * t + 0.5) | 0,
      (a[2] + (b[2] - a[2]) * t + 0.5) | 0
    ];
  }

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    noiseBuf: null,
    ensure() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.32;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.32;
      btnMute.textContent = m ? '静' : '声';
      btnMute.classList.toggle('muted', m);
      btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      try {
        localStorage.setItem(MUTE_KEY, m ? '1' : '0');
      } catch (err) { /* ignore */ }
    },
    beep(freq, dur, type, vol, slide) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
      g.gain.setValueAtTime(Math.max(0.0001, vol), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + dur + 0.03);
    },
    noise(dur, vol, freq, type) {
      if (!this.ctx || this.muted) return;
      if (!this.noiseBuf) {
        const sr = this.ctx.sampleRate;
        const buf = this.ctx.createBuffer(1, (sr * 0.28) | 0, sr);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        this.noiseBuf = buf;
      }
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      const f = this.ctx.createBiquadFilter();
      f.type = type || 'bandpass';
      f.frequency.value = freq || 900;
      f.Q.value = type === 'lowpass' ? 0.7 : 1.2;
      const g = this.ctx.createGain();
      const t = this.ctx.currentTime;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
      src.stop(t + dur + 0.02);
    },
    swap() {
      this.ensure();
      this.beep(640, 0.05, 'triangle', 0.03, 880);
      this.beep(880, 0.06, 'sine', 0.025);
    },
    fail() {
      this.ensure();
      this.beep(180, 0.09, 'square', 0.028, 90);
      this.beep(110, 0.12, 'sine', 0.03, 60);
    },
    match(chain, n) {
      this.ensure();
      const p = 1 + (chain - 1) * 0.12;
      this.noise(0.05, 0.07, 1400 * p, 'highpass');
      this.beep(420 * p, 0.07, 'sine', 0.05, 720 * p);
      this.beep(840 * p, 0.09, 'triangle', 0.04);
      if (n >= 4) this.beep(1240 * p, 0.1, 'sine', 0.035, 1680 * p);
    },
    stripe() {
      this.ensure();
      this.noise(0.1, 0.09, 1800, 'bandpass');
      this.beep(240, 0.12, 'sawtooth', 0.05, 90);
      this.beep(1480, 0.08, 'triangle', 0.04, 420);
    },
    bomb() {
      this.ensure();
      this.noise(0.18, 0.12, 220, 'lowpass');
      this.noise(0.1, 0.07, 1600, 'highpass');
      this.beep(90, 0.22, 'sine', 0.09, 42);
      this.beep(520, 0.16, 'triangle', 0.05, 1100);
    },
    land() {
      this.ensure();
      this.beep(240, 0.04, 'sine', 0.02, 140);
    },
    shuffle() {
      this.ensure();
      this.noise(0.16, 0.06, 900, 'bandpass');
      this.beep(330, 0.1, 'triangle', 0.04, 660);
      this.beep(660, 0.14, 'sine', 0.03, 990);
    },
    combo(n) {
      this.ensure();
      const f = 480 + n * 70;
      this.beep(f, 0.08, 'sine', 0.05, f * 1.45);
      this.beep(f * 1.26, 0.11, 'triangle', 0.04);
    },
    start() {
      this.ensure();
      this.beep(392, 0.08, 'sine', 0.045, 784);
      this.beep(784, 0.12, 'triangle', 0.035, 1175);
    },
    over() {
      this.ensure();
      this.beep(330, 0.14, 'triangle', 0.04, 196);
      this.beep(196, 0.26, 'sine', 0.05, 98);
    },
    tick() {
      this.ensure();
      this.beep(880, 0.05, 'square', 0.028);
    },
    select() {
      this.ensure();
      this.beep(760, 0.04, 'sine', 0.02);
    }
  };

  function currentBest() {
    return G.kind === 'time' ? G.bestT : G.bestM;
  }

  function loadBest() {
    try {
      const raw = localStorage.getItem(BEST_KEY);
      if (!raw) {
        G.bestM = 0;
        G.bestT = 0;
      } else if (raw.charAt(0) === '{') {
        const j = JSON.parse(raw);
        G.bestM = j && isFinite(j.m) ? j.m | 0 : 0;
        G.bestT = j && isFinite(j.t) ? j.t | 0 : 0;
      } else {
        const n = parseInt(raw, 10);
        G.bestM = isFinite(n) && n > 0 ? n : 0;
        G.bestT = 0;
      }
    } catch (err) {
      G.bestM = 0;
      G.bestT = 0;
    }
    bestEl.textContent = String(currentBest());
  }

  function saveBest() {
    const k = G.kind === 'time' ? 'bestT' : 'bestM';
    if (G.score <= G[k]) return false;
    G[k] = G.score;
    bestEl.textContent = String(G[k]);
    G.newBest = true;
    try {
      localStorage.setItem(BEST_KEY, JSON.stringify({ m: G.bestM, t: G.bestT }));
    } catch (err) { /* ignore */ }
    return true;
  }

  function loadMute() {
    try {
      audio.setMuted(localStorage.getItem(MUTE_KEY) === '1');
    } catch (err) {
      audio.setMuted(false);
    }
  }

  function loadMode() {
    try {
      const m = localStorage.getItem(MODE_KEY);
      if (m === 'time' || m === 'moves') G.kind = m;
    } catch (err) { /* ignore */ }
  }

  function saveMode() {
    try {
      localStorage.setItem(MODE_KEY, G.kind);
    } catch (err) { /* ignore */ }
  }

  function loadAutoSpeed() {
    try {
      const n = parseInt(localStorage.getItem(AUTO_SPEED_KEY) || '3', 10);
      if (n >= 1 && n <= 4) return n;
    } catch (err) { /* ignore */ }
    return 3;
  }

  function saveAutoSpeed(n) {
    try {
      localStorage.setItem(AUTO_SPEED_KEY, String(n));
    } catch (err) { /* ignore */ }
  }

  function syncAutoBtn() {
    btnAuto.classList.toggle('on', autoOn);
    btnAuto.setAttribute('aria-pressed', autoOn ? 'true' : 'false');
    btnAuto.textContent = autoOn ? '停下' : '自动';
    btnAuto.setAttribute('aria-label', autoOn ? '停止自动' : '自动');
  }

  function syncSpeedUI() {
    speedEl.value = String(autoSpeed);
    speedLab.textContent = AUTO_SPEED_NAME[autoSpeed];
    speedEl.title = AUTO_SPEED_NAME[autoSpeed];
    speedEl.setAttribute('aria-valuetext', AUTO_SPEED_NAME[autoSpeed]);
  }

  function toggleAuto() {
    autoOn = !autoOn;
    autoWait = 0;
    syncAutoBtn();
    if (!autoOn) {
      hudPlay();
      return;
    }
    audio.ensure();
    if (G.mode === 'title' || G.mode === 'over') startGame(G.kind || 'moves');
    else hudPlay();
  }

  function setAutoSpeed(n) {
    if (!(n >= 1 && n <= 4)) n = 3;
    autoSpeed = n;
    saveAutoSpeed(n);
    syncSpeedUI();
    hudPlay();
  }

  function tickAuto(dt) {
    if (!autoOn || G.mode !== 'play' || G.phase !== 'idle' || G.pendingEnd) {
      if (G.phase !== 'idle') autoWait = 0;
      return;
    }
    autoWait += dt;
    if (autoWait < AUTO_DELAY[autoSpeed]) return;
    autoWait = 0;
    const mv = pickAutoMove(board);
    if (!mv) return;
    beginSwap(mv[0][0], mv[0][1], mv[1][0], mv[1][1]);
  }

  function addScore(n) {
    if (G.mode !== 'play' || n <= 0) return;
    G.score += n;
    scoreEl.textContent = String(G.score);
    saveBest();
    scoreBox.classList.remove('flash');
    void scoreBox.offsetWidth;
    scoreBox.classList.add('flash');
    addTok += 1;
    const tok = addTok;
    scoreAdd.hidden = false;
    scoreAdd.textContent = '+' + n;
    scoreAdd.style.animation = 'none';
    void scoreAdd.offsetWidth;
    scoreAdd.style.animation = '';
    setTimeout(function () {
      if (tok === addTok) scoreAdd.hidden = true;
    }, 700);
  }

  function setComboHud() {
    const n = Math.max(1, G.chain);
    comboEl.textContent = '×' + n;
    if (n >= 2) {
      comboBox.classList.remove('hot');
      void comboBox.offsetWidth;
      comboBox.classList.add('hot');
    } else {
      comboBox.classList.remove('hot');
    }
  }

  function toast(msg, warn, gold) {
    toastTok += 1;
    const tok = toastTok;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold && !warn);
    toastEl.classList.remove('hidden');
    setTimeout(function () {
      if (tok === toastTok) toastEl.classList.add('hidden');
    }, 900);
  }

  function hudPlay() {
    scoreEl.textContent = String(G.score);
    bestEl.textContent = String(currentBest());
    setComboHud();
    if (G.mode !== 'play') {
      modeLabel.textContent = G.kind === 'time' ? '限时' : '限步';
      resLabel.textContent = G.kind === 'time' ? TIME + ' 秒' : MOVES + ' 步';
      resLabel.className = '';
      tagLabel.textContent = 'MATCH';
      return;
    }
    if (G.kind === 'time') {
      modeLabel.textContent = '限时';
      const sec = Math.ceil(Math.max(0, G.left));
      resLabel.textContent = sec + ' 秒';
      const warn = G.mode === 'play' && G.left <= 10;
      resLabel.className = warn ? 'warn' : '';
      tagLabel.textContent = 'TIME';
      hintEl.textContent = warn ? '最后十秒 · 抓紧连消' : OPS_PLAY;
      hintEl.className = warn ? 'hint warn' : 'hint';
    } else {
      modeLabel.textContent = '限步';
      resLabel.textContent = G.left + ' 步';
      const warn = G.mode === 'play' && G.left <= 5;
      resLabel.className = warn ? 'warn' : G.left <= 10 ? 'hot' : '';
      tagLabel.textContent = 'MOVES';
      hintEl.textContent = warn ? '步数不多了' : OPS_PLAY;
      hintEl.className = warn ? 'hint warn' : 'hint';
    }
    if (autoOn) {
      hintEl.textContent = '自动托管中 · A 停下 · 速度 ' + AUTO_SPEED_NAME[autoSpeed];
      hintEl.className = 'hint';
    }
  }

  function spawnGem(r, c, color, spec) {
    return {
      id: gid++,
      color: color,
      spec: spec || NONE,
      r: r,
      c: c,
      x: c + 0.5,
      y: r + 0.5,
      scale: 1,
      alpha: 1,
      squash: 0,
      flash: 0,
      spin: rand(0, TAU),
      vy: 0,
      sx: c + 0.5,
      sy: r + 0.5,
      dead: false,
      popping: false
    };
  }

  function buildFromLayout(layout, dropIn) {
    board = [];
    gems = [];
    for (let r = 0; r < N; r++) {
      board[r] = [];
      for (let c = 0; c < N; c++) {
        const src = layout[r][c];
        const g = spawnGem(r, c, src.color, src.spec || NONE);
        if (dropIn) {
          g.y = r + 0.5 - (N + 1.2 + (N - r) * 0.18);
          g.vy = 0;
        }
        board[r][c] = g;
        gems.push(g);
      }
    }
  }

  function hitStop(sec) {
    if (fastFx()) return;
    G.freeze = Math.max(G.freeze, sec);
  }

  function kick(mag) {
    if (fastFx()) return;
    const a = rand(0, TAU);
    G.kickX += Math.cos(a) * mag;
    G.kickY += Math.sin(a) * mag;
    G.shake = Math.max(G.shake, mag * 0.5);
    G.punch = Math.max(G.punch, 1 + Math.min(0.04, mag * 0.004));
    kickTok += 1;
    stageEl.classList.remove('cut');
    void stageEl.offsetWidth;
    stageEl.classList.add('cut');
  }

  function screenFlash(rgb, a) {
    G.flash = Math.max(G.flash, a || 0.4);
    G.flashRgb = rgb;
  }

  function capArr(arr, n) {
    if (arr.length > n) arr.splice(0, arr.length - n);
  }

  function emit(n, spec) {
    const count = fastFx() ? Math.min(4, n) : n;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        r: rand(spec.r0, spec.r1),
        life: rand(spec.life * 0.55, spec.life),
        max: spec.life,
        rgb: spec.rgb,
        g: spec.g || 0.9
      });
    }
  }

  function emitSparks(n, x, y, rgb) {
    const count = fastFx() ? Math.min(3, n) : n;
    for (let i = 0; i < count; i++) {
      const a = rand(0, TAU);
      const sp = rand(2.2, 7.5);
      sparks.push({
        x: x,
        y: y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: rand(0.18, 0.38),
        max: 0.38,
        rgb: rgb
      });
    }
  }

  function addFloat(x, y, text, rgb, scale) {
    floats.push({
      x: x,
      y: y,
      text: text,
      rgb: rgb,
      life: 0.9,
      max: 0.9,
      scale: scale || 1
    });
  }

  function addRing(x, y, rgb) {
    rings.push({ x: x, y: y, rgb: rgb, life: 0.34, max: 0.34 });
  }

  function px(gx, gy) {
    return { x: ox + gx * cell, y: oy + gy * cell };
  }

  function burstGem(g) {
    const p = px(g.x, g.y);
    const rgb = PAL[g.color] || PAL[0];
    emit(g.spec === BOMB ? 18 : 11, {
      x: p.x,
      y: p.y,
      j: cell * 0.18,
      vx0: -5.5,
      vx1: 5.5,
      vy0: -7.2,
      vy1: 2.4,
      r0: 1.6,
      r1: cell * 0.12,
      life: 0.42,
      rgb: rgb
    });
    emitSparks(g.spec ? 10 : 6, p.x, p.y, rgb);
    addRing(p.x, p.y, rgb);
  }

  function burstWave() {
    if (G.popped) return;
    G.popped = true;
    const n = G.clear.size;
    let sx = 0;
    let sy = 0;
    let count = 0;
    let hadStripe = false;
    let hadBomb =
      G.swapSpecial &&
      ((G.swapA && G.swapA.spec === BOMB) || (G.swapB && G.swapB.spec === BOMB));
    let maxRun = 0;
    for (let i = 0; i < G.groups.length; i++) {
      if (G.groups[i].n > maxRun) maxRun = G.groups[i].n;
    }
    G.clear.forEach(function (k) {
      const g = board[rk(k)][ck(k)];
      if (!g) return;
      g.popping = true;
      g.flash = 1;
      burstGem(g);
      const p = px(g.x, g.y);
      sx += p.x;
      sy += p.y;
      count += 1;
      if (g.spec === HS) {
        hadStripe = true;
        beams.push({ axis: 'h', i: g.r, life: 0.28, max: 0.28, rgb: PAL[g.color] });
      } else if (g.spec === VS) {
        hadStripe = true;
        beams.push({ axis: 'v', i: g.c, life: 0.28, max: 0.28, rgb: PAL[g.color] });
      } else if (g.spec === BOMB) {
        hadBomb = true;
      }
    });
    const cx = count ? sx / count : ox + boardSize / 2;
    const cy = count ? sy / count : oy + boardSize / 2;
    const chain = Math.max(1, G.chain);
    let pts = n * 20 * chain;
    if (maxRun >= 4) pts += 50 * chain;
    if (maxRun >= 5) pts += 120 * chain;
    if (hadStripe) pts += 80 * chain;
    if (hadBomb) pts += 160 * chain;
    for (let i = 0; i < G.specials.length; i++) {
      pts += G.specials[i].spec === BOMB ? 200 : 80;
    }
    addScore(pts);
    addFloat(cx, cy - cell * 0.2, '+' + pts, PAL[0], chain >= 3 ? 1.25 : 1);
    if (chain >= 2) {
      const word = COMBO_WORD[Math.min(COMBO_WORD.length - 1, chain)] || '连消';
      addFloat(cx, cy + cell * 0.45, word + ' ×' + chain, [0, 240, 255], 1.1);
      toast(word + ' ×' + chain, false, true);
      audio.combo(chain);
    }
    if (hadBomb) {
      audio.bomb();
      screenFlash([255, 227, 107], 0.42);
      kick(10);
      hitStop(0.08);
    } else if (hadStripe) {
      audio.stripe();
      screenFlash([0, 240, 255], 0.28);
      kick(7);
      hitStop(0.07);
    } else if (maxRun >= 5) {
      audio.match(chain, 5);
      screenFlash(PAL[0], 0.22);
      kick(6);
      hitStop(0.065);
    } else {
      audio.match(chain, maxRun || n);
      kick(3 + Math.min(5, chain));
      hitStop(clamp(0.032 + n * 0.003 + (chain - 1) * 0.008, 0.03, 0.078));
    }
    if (G.maxChain < chain) G.maxChain = chain;
    setComboHud();
    G.swapSpecial = false;
  }

  function applyPop() {
    G.clear.forEach(function (k) {
      const r = rk(k);
      const c = ck(k);
      const g = board[r][c];
      if (g) {
        g.dead = true;
        g.popping = true;
      }
      board[r][c] = null;
    });
    for (let i = 0; i < G.specials.length; i++) {
      const sp = G.specials[i];
      const ng = spawnGem(sp.r, sp.c, sp.color, sp.spec);
      ng.scale = fastFx() ? 1 : 0.2;
      ng.squash = -0.18;
      board[sp.r][sp.c] = ng;
      gems.push(ng);
      const p = px(ng.x, ng.y);
      addRing(p.x, p.y, sp.spec === BOMB ? [255, 255, 255] : PAL[sp.color]);
      addFloat(p.x, p.y - cell * 0.35, sp.spec === BOMB ? '彩爆' : '划爆', PAL[sp.color], 0.9);
    }
    gems = gems.filter(function (g) {
      return !g.dead;
    });
    setupFall();
  }

  function setupFall() {
    for (let c = 0; c < N; c++) {
      const stack = [];
      for (let r = N - 1; r >= 0; r--) {
        const g = board[r][c];
        if (g && !g.dead) stack.push(g);
      }
      for (let r = 0; r < N; r++) board[r][c] = null;
      let write = N - 1;
      for (let i = 0; i < stack.length; i++) {
        const g = stack[i];
        g.r = write;
        g.c = c;
        g.popping = false;
        board[write][c] = g;
        write -= 1;
      }
      let spawn = 0;
      for (let r = write; r >= 0; r--) {
        spawn += 1;
        const g = spawnGem(r, c, irand(COLORS), NONE);
        g.y = fastFx() ? r + 0.5 : -spawn + 0.35;
        g.x = c + 0.5;
        g.vy = 0;
        g.scale = fastFx() ? 1 : 0.86;
        board[r][c] = g;
        gems.push(g);
      }
    }
    G.phase = 'fall';
    G.phaseT = 0;
    G.landedSfx = false;
  }

  function settleOrShuffle() {
    G.originR = -1;
    G.originC = -1;
    const groups = findGroups(board);
    if (groups.length) {
      startMatchWave(groups, false);
      return;
    }
    if (G.pendingEnd) {
      endRound();
      return;
    }
    if (!findValidMove(board)) {
      startShuffle();
      return;
    }
    G.phase = 'idle';
    G.phaseT = 0;
    G.idle = 0;
    G.hint = null;
  }

  function startMatchWave(groups, fromSwap) {
    G.groups = groups;
    G.specials = fromSwap ? planSpecials(groups, G.originR, G.originC) : planSpecials(groups, -1, -1);
    G.clear = collectClears(board, groups);
    G.phase = 'flash';
    G.phaseT = 0;
    G.popped = false;
    G.chain = fromSwap ? 1 : G.chain + 1;
    G.clear.forEach(function (k) {
      const g = board[rk(k)][ck(k)];
      if (g) g.flash = 1;
    });
  }

  function startSpecialWave(a, b) {
    G.groups = [];
    G.specials = [];
    G.clear = specialClearSet(board, a, b);
    G.phase = 'flash';
    G.phaseT = 0;
    G.popped = false;
    G.chain = 1;
    G.clear.forEach(function (k) {
      const g = board[rk(k)][ck(k)];
      if (g) g.flash = 1;
    });
  }

  function startShuffle() {
    toast('没有着了 · 洗牌', false, true);
    audio.shuffle();
    kick(4);
    const layout = permutePlayable(board);
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const g = board[r][c];
        if (!g) continue;
        const p = px(g.x, g.y);
        emit(5, {
          x: p.x,
          y: p.y,
          j: cell * 0.1,
          vx0: -3,
          vx1: 3,
          vy0: -4,
          vy1: 1,
          r0: 1.2,
          r1: 3.4,
          life: 0.3,
          rgb: PAL[g.color]
        });
      }
    }
    buildFromLayout(layout, true);
    G.phase = 'fall';
    G.phaseT = 0;
    G.landedSfx = false;
    G.hint = null;
  }

  function beginSwap(r1, c1, r2, c2) {
    if (G.mode !== 'play' || G.phase !== 'idle' || G.pendingEnd) return false;
    if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) return false;
    if (r2 < 0 || c2 < 0 || r2 >= N || c2 >= N) return false;
    const a = board[r1][c1];
    const b = board[r2][c2];
    if (!a || !b || a.dead || b.dead) return false;
    audio.ensure();
    const special = isSpecialSwap(a, b);
    const valid = special || swapCreatesMatch(board, r1, c1, r2, c2);
    a.sx = a.x;
    a.sy = a.y;
    b.sx = b.x;
    b.sy = b.y;
    board[r1][c1] = b;
    b.r = r1;
    b.c = c1;
    board[r2][c2] = a;
    a.r = r2;
    a.c = c2;
    G.phase = 'swap';
    G.phaseT = 0;
    G.swapA = a;
    G.swapB = b;
    G.swapValid = valid;
    G.swapSpecial = special;
    G.originR = r2;
    G.originC = c2;
    G.selected = null;
    G.hint = null;
    G.idle = 0;
    if (valid) audio.swap();
    return true;
  }

  function spendMove() {
    if (G.kind !== 'moves') return;
    G.left = Math.max(0, G.left - 1);
    hudPlay();
    if (G.left <= 0) G.pendingEnd = 'moves';
  }

  function finishSwap() {
    if (!G.swapValid) {
      const a = G.swapA;
      const b = G.swapB;
      a.sx = a.x;
      a.sy = a.y;
      b.sx = b.x;
      b.sy = b.y;
      board[a.r][a.c] = b;
      board[b.r][b.c] = a;
      const ar = a.r;
      const ac = a.c;
      a.r = b.r;
      a.c = b.c;
      b.r = ar;
      b.c = ac;
      G.phase = 'snap';
      G.phaseT = 0;
      audio.fail();
      if (!fastFx()) {
        stageEl.classList.remove('noop');
        void stageEl.offsetWidth;
        stageEl.classList.add('noop');
      }
      return;
    }
    spendMove();
    G.chain = 1;
    setComboHud();
    if (G.swapSpecial) startSpecialWave(G.swapA, G.swapB);
    else {
      const groups = findGroups(board);
      if (groups.length) startMatchWave(groups, true);
      else settleOrShuffle();
    }
  }

  function endRound() {
    if (G.mode !== 'play') return;
    G.mode = 'over';
    G.phase = 'idle';
    audio.over();
    const why = G.pendingEnd === 'time' ? '时间到' : '步数用尽';
    G.why = why;
    const best = currentBest();
    const rec = G.newBest;
    ovKicker.textContent = G.kind === 'time' ? 'TIME' : 'MOVES';
    ovTitle.textContent = why;
    ovLead.textContent =
      '本局 ' +
      G.score +
      ' 分 · 最高连消 ×' +
      Math.max(1, G.maxChain) +
      (rec ? ' · 新纪录' : ' · 最高 ' + best);
    ovOps.textContent = '顶栏重开或 R 立刻再来 · 也可改模式';
    panel.className = 'panel' + (rec ? ' win' : ' lose');
    overlay.classList.remove('hidden');
    overlay.classList.add('bottom');
    overlay.setAttribute('aria-hidden', 'false');
    hintEl.textContent = 'R 重开';
    btnMoves.textContent = '限步 30';
    btnTime.textContent = '限时 60';
  }

  function showTitle() {
    G.mode = 'title';
    G.phase = 'idle';
    G.pendingEnd = null;
    G.chain = 1;
    G.score = 0;
    ovKicker.textContent = 'MATCH';
    ovTitle.textContent = '三消';
    ovLead.textContent = '相邻对换，三个一样就消。落下还能连消。';
    ovOps.textContent = OPS_TITLE;
    panel.className = 'panel';
    overlay.classList.remove('hidden', 'bottom');
    overlay.setAttribute('aria-hidden', 'false');
    hintEl.textContent = '三个一样就消 · 选限步或限时';
    hintEl.className = 'hint';
    modeLabel.textContent = G.kind === 'time' ? '限时' : '限步';
    resLabel.textContent = G.kind === 'time' ? TIME + ' 秒' : MOVES + ' 步';
    resLabel.className = '';
    tagLabel.textContent = 'MATCH';
    scoreEl.textContent = '0';
    comboEl.textContent = '×1';
    bestEl.textContent = String(currentBest());
    buildFromLayout(makePlayableBoard(), false);
  }

  function startGame(kind) {
    audio.ensure();
    audio.start();
    G.kind = kind === 'time' ? 'time' : 'moves';
    saveMode();
    G.mode = 'play';
    G.phase = 'idle';
    G.score = 0;
    G.chain = 1;
    G.maxChain = 1;
    G.left = G.kind === 'time' ? TIME : MOVES;
    G.pendingEnd = null;
    G.newBest = false;
    G.selected = null;
    G.hint = null;
    G.idle = 0;
    G.freeze = 0;
    G.flash = 0;
    G.cursorR = 3;
    G.cursorC = 3;
    autoWait = 0;
    timeWarnTok = -1;
    particles.length = 0;
    sparks.length = 0;
    beams.length = 0;
    floats.length = 0;
    rings.length = 0;
    overlay.classList.add('hidden');
    overlay.classList.remove('bottom');
    overlay.setAttribute('aria-hidden', 'true');
    panel.className = 'panel';
    buildFromLayout(makePlayableBoard(), !fastFx());
    G.phase = 'fall';
    G.landedSfx = false;
    hudPlay();
    canvas.focus();
  }

  function retry() {
    audio.ensure();
    if (G.mode === 'title') startGame(G.kind || 'moves');
    else startGame(G.kind);
  }

  function resize() {
    const rect = stageEl.getBoundingClientRect();
    dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    canvas.width = (W * dpr) | 0;
    canvas.height = (H * dpr) | 0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const pad = Math.max(10, Math.min(22, Math.min(W, H) * 0.04));
    boardSize = Math.min(W, H) - pad * 2;
    cell = boardSize / N;
    ox = (W - boardSize) / 2;
    oy = (H - boardSize) / 2;
  }

  function cellAt(cssX, cssY) {
    const c = Math.floor((cssX - ox) / cell);
    const r = Math.floor((cssY - oy) / cell);
    if (r < 0 || c < 0 || r >= N || c >= N) return null;
    return { r: r, c: c };
  }

  function eventXY(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  function trySelectOrSwap(r, c) {
    if (autoOn || G.mode !== 'play' || G.phase !== 'idle') return;
    G.cursorR = r;
    G.cursorC = c;
    if (!G.selected) {
      G.selected = { r: r, c: c };
      audio.select();
      return;
    }
    if (G.selected.r === r && G.selected.c === c) {
      G.selected = null;
      return;
    }
    if (Math.abs(G.selected.r - r) + Math.abs(G.selected.c - c) === 1) {
      beginSwap(G.selected.r, G.selected.c, r, c);
      return;
    }
    G.selected = { r: r, c: c };
    audio.select();
  }

  function updateHint() {
    if (autoOn || G.mode !== 'play' || G.phase !== 'idle') {
      G.hint = null;
      return;
    }
    if (G.idle < 5) {
      G.hint = null;
      return;
    }
    if (!G.hint) G.hint = findValidMove(board);
  }

  function updateFall(dt) {
    let allLanded = true;
    for (let i = 0; i < gems.length; i++) {
      const g = gems[i];
      const tx = g.c + 0.5;
      const ty = g.r + 0.5;
      g.x = lerp(g.x, tx, Math.min(1, dt * 18));
      if (g.scale < 1) g.scale = Math.min(1, g.scale + dt * 5);
      if (g.y < ty - 0.002) {
        allLanded = false;
        if (fastFx()) {
          g.y = ty;
          g.vy = 0;
        } else {
          g.vy += GRAV * dt;
          g.y += g.vy * dt;
          if (g.y >= ty) {
            g.y = ty;
            g.vy = 0;
            g.squash = 0.22;
            if (!G.landedSfx) {
              audio.land();
              G.landedSfx = true;
            }
          }
        }
      } else {
        g.y = ty;
        g.squash *= Math.pow(0.04, dt);
        if (g.squash < 0.002) g.squash = 0;
      }
    }
    if (allLanded) settleOrShuffle();
  }

  function updateSwap(dt, back) {
    const dur = back ? SNAP_T : SWAP_T;
    G.phaseT += dt;
    const t = Math.min(1, G.phaseT / (fastFx() ? 0.01 : dur));
    const k = back ? easeInOut(t) : easeOut(t);
    const a = G.swapA;
    const b = G.swapB;
    if (a) {
      a.x = lerp(a.sx, a.c + 0.5, k);
      a.y = lerp(a.sy, a.r + 0.5, k);
    }
    if (b) {
      b.x = lerp(b.sx, b.c + 0.5, k);
      b.y = lerp(b.sy, b.r + 0.5, k);
    }
    if (t >= 1) {
      if (a) {
        a.x = a.c + 0.5;
        a.y = a.r + 0.5;
      }
      if (b) {
        b.x = b.c + 0.5;
        b.y = b.r + 0.5;
      }
      if (back) {
        G.phase = 'idle';
        G.idle = 0;
      } else finishSwap();
    }
  }

  function updateFlash(dt) {
    G.phaseT += dt;
    G.clear.forEach(function (k) {
      const g = board[rk(k)][ck(k)];
      if (g) g.flash = 1;
    });
    if (G.phaseT >= (fastFx() ? 0.01 : FLASH_T)) {
      burstWave();
      G.phase = 'pop';
      G.phaseT = 0;
    }
  }

  function updatePop(dt) {
    G.phaseT += dt;
    const t = Math.min(1, G.phaseT / (fastFx() ? 0.01 : POP_T));
    G.clear.forEach(function (k) {
      const g = board[rk(k)][ck(k)];
      if (!g) return;
      g.scale = 1 - easeOut(t) * 1.05;
      g.flash = 1;
      g.alpha = 1 - t * 0.5;
    });
    if (t >= 1) applyPop();
  }

  function updateFx(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * cell * dt;
      p.y += p.vy * cell * dt;
      p.vy += 9 * dt;
      p.vx *= 0.98;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i];
      p.life -= dt;
      p.x += p.vx * cell * dt;
      p.y += p.vy * cell * dt;
      if (p.life <= 0) sparks.splice(i, 1);
    }
    for (let i = beams.length - 1; i >= 0; i--) {
      beams[i].life -= dt;
      if (beams[i].life <= 0) beams.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.life -= dt;
      f.y -= cell * 0.7 * dt;
      if (f.life <= 0) floats.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].life -= dt;
      if (rings[i].life <= 0) rings.splice(i, 1);
    }
    capArr(particles, 420);
    capArr(sparks, 180);
    G.kickX *= Math.pow(0.04, dt);
    G.kickY *= Math.pow(0.04, dt);
    G.shake *= Math.pow(0.08, dt);
    G.punch = lerp(G.punch, 1, Math.min(1, dt * 10));
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
  }

  function tickClock(dt) {
    if (G.mode !== 'play' || G.kind !== 'time' || G.pendingEnd) return;
    G.left -= dt;
    if (G.left < 0) G.left = 0;
    const sec = Math.ceil(G.left);
    if (sec <= 10 && sec !== timeWarnTok && G.left > 0) {
      timeWarnTok = sec;
      audio.tick();
    }
    hudPlay();
    if (G.left <= 0) {
      G.pendingEnd = 'time';
      if (G.phase === 'idle') endRound();
    }
  }

  function step(dt) {
    G.t += dt;
    if (G.mode === 'play') tickClock(dt);
    if (G.freeze > 0) {
      G.freeze -= dt;
      updateFx(dt * 0.35);
      return;
    }
    if (G.phase === 'swap') updateSwap(dt, false);
    else if (G.phase === 'snap') updateSwap(dt, true);
    else if (G.phase === 'flash') updateFlash(dt);
    else if (G.phase === 'pop') updatePop(dt);
    else if (G.phase === 'fall') updateFall(dt);
    else if (G.phase === 'idle') {
      G.idle += dt;
      tickAuto(dt);
      updateHint();
      for (let i = 0; i < gems.length; i++) {
        const g = gems[i];
        g.x = lerp(g.x, g.c + 0.5, Math.min(1, dt * 16));
        g.y = lerp(g.y, g.r + 0.5, Math.min(1, dt * 16));
        g.squash *= Math.pow(0.05, dt);
        if (g.flash > 0) g.flash = Math.max(0, g.flash - dt * 6);
        if (g.scale < 1) g.scale = Math.min(1, g.scale + dt * 5);
        g.alpha = 1;
      }
    }
    updateFx(dt);
  }

  function hexPath(x, y, r) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 3;
      const px = x + Math.cos(a) * r;
      const py = y + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  function drawGem(g) {
    const p = px(g.x, g.y);
    const sel =
      G.selected && G.selected.r === g.r && G.selected.c === g.c && !g.popping;
    const hinted =
      G.hint &&
      ((G.hint[0][0] === g.r && G.hint[0][1] === g.c) ||
        (G.hint[1][0] === g.r && G.hint[1][1] === g.c));
    const breathe =
      G.phase === 'idle' && G.mode !== 'over'
        ? 1 + Math.sin(G.t * 2.2 + g.id * 0.7) * 0.018
        : 1;
    const lift = sel ? -cell * 0.06 : 0;
    const s = cell * 0.42 * g.scale * breathe * (sel ? 1.08 : 1) * (hinted ? 1.04 : 1);
    const rgb = PAL[g.color] || PAL[0];
    const dark = PAL_D[g.color] || PAL_D[0];
    const lite = PAL_L[g.color] || PAL_L[0];
    ctx.save();
    ctx.globalAlpha = g.alpha;
    ctx.translate(p.x, p.y + lift);
    ctx.scale(1 + g.squash, 1 - g.squash * 0.85);
    ctx.rotate(g.spec === BOMB ? G.t * 0.6 : 0);

    ctx.beginPath();
    ctx.ellipse(0, s * 0.78, s * 0.62, s * 0.18, 0, 0, TAU);
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.fill();

    ctx.shadowColor = rgba(rgb, sel || g.flash ? 0.85 : 0.45);
    ctx.shadowBlur = cell * (sel || g.flash > 0.4 ? 0.38 : 0.2);
    hexPath(0, 0, s);
    const grad = ctx.createLinearGradient(-s, -s, s, s);
    grad.addColorStop(0, rgba(lite, 1));
    grad.addColorStop(0.42, rgba(rgb, 1));
    grad.addColorStop(1, rgba(dark, 1));
    ctx.fillStyle = g.spec === BOMB ? '#22182e' : grad;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = rgba(lite, 0.55);
    ctx.lineWidth = Math.max(1, cell * 0.03);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-s * 0.12, -s * 0.62);
    ctx.lineTo(s * 0.38, -s * 0.18);
    ctx.lineTo(s * 0.08, s * 0.08);
    ctx.lineTo(-s * 0.42, -s * 0.22);
    ctx.closePath();
    ctx.fillStyle = g.spec === BOMB ? rgba([255, 255, 255], 0.14) : rgba([255, 255, 255], 0.28);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(-s * 0.18, -s * 0.22, s * 0.16, s * 0.1, -0.5, 0, TAU);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fill();

    if (g.spec === HS || g.spec === VS) {
      ctx.save();
      ctx.beginPath();
      hexPath(0, 0, s * 0.92);
      ctx.clip();
      ctx.strokeStyle = 'rgba(255,255,255,0.92)';
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 8;
      ctx.lineWidth = Math.max(2, cell * 0.07);
      ctx.lineCap = 'round';
      if (g.spec === HS) {
        ctx.beginPath();
        ctx.moveTo(-s * 0.72, 0);
        ctx.lineTo(s * 0.72, 0);
        ctx.stroke();
        ctx.strokeStyle = rgba(rgb, 0.7);
        ctx.lineWidth = Math.max(1, cell * 0.03);
        ctx.beginPath();
        ctx.moveTo(-s * 0.72, -s * 0.22);
        ctx.lineTo(s * 0.72, -s * 0.22);
        ctx.moveTo(-s * 0.72, s * 0.22);
        ctx.lineTo(s * 0.72, s * 0.22);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.72);
        ctx.lineTo(0, s * 0.72);
        ctx.stroke();
        ctx.strokeStyle = rgba(rgb, 0.7);
        ctx.lineWidth = Math.max(1, cell * 0.03);
        ctx.beginPath();
        ctx.moveTo(-s * 0.22, -s * 0.72);
        ctx.lineTo(-s * 0.22, s * 0.72);
        ctx.moveTo(s * 0.22, -s * 0.72);
        ctx.lineTo(s * 0.22, s * 0.72);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (g.spec === BOMB) {
      ctx.save();
      hexPath(0, 0, s * 0.72);
      const rg = ctx.createRadialGradient(-s * 0.1, -s * 0.1, s * 0.05, 0, 0, s * 0.7);
      rg.addColorStop(0, '#fff');
      rg.addColorStop(0.18, rgba(lite, 1));
      rg.addColorStop(0.55, rgba(rgb, 1));
      rg.addColorStop(1, rgba(dark, 1));
      ctx.fillStyle = rg;
      ctx.fill();
      ctx.rotate(-G.t * 1.4);
      ctx.strokeStyle = rgba([255, 227, 107], 0.95);
      ctx.lineWidth = Math.max(1.4, cell * 0.045);
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.86, 0, 2.2);
      ctx.stroke();
      ctx.strokeStyle = rgba([0, 240, 255], 0.9);
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.86, Math.PI, Math.PI + 2.2);
      ctx.stroke();
      ctx.restore();
    }

    if (g.flash > 0) {
      hexPath(0, 0, s * 1.02);
      ctx.fillStyle = rgba([255, 255, 255], 0.45 * g.flash);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawBoardBack() {
    ctx.fillStyle = '#05030c';
    ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(
      ox + boardSize * 0.3,
      oy + boardSize * 0.2,
      10,
      ox + boardSize * 0.5,
      oy + boardSize * 0.5,
      boardSize * 0.9
    );
    glow.addColorStop(0, 'rgba(255,176,32,0.1)');
    glow.addColorStop(0.55, 'rgba(0,240,255,0.04)');
    glow.addColorStop(1, 'rgba(5,3,12,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    const rad = Math.max(12, cell * 0.28);
    ctx.save();
    roundRect(ox - cell * 0.12, oy - cell * 0.12, boardSize + cell * 0.24, boardSize + cell * 0.24, rad);
    ctx.fillStyle = '#0c0814';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,176,32,0.32)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const x = ox + c * cell;
        const y = oy + r * cell;
        const m = cell * 0.08;
        roundRect(x + m, y + m, cell - m * 2, cell - m * 2, cell * 0.18);
        ctx.fillStyle = (r + c) % 2 === 0 ? 'rgba(255,180,70,0.06)' : 'rgba(0,240,255,0.035)';
        ctx.fill();
      }
    }
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

  function drawCursor() {
    if (G.mode !== 'play') return;
    const r = G.cursorR;
    const c = G.cursorC;
    const x = ox + c * cell;
    const y = oy + r * cell;
    const m = cell * 0.06;
    ctx.save();
    roundRect(x + m, y + m, cell - m * 2, cell - m * 2, cell * 0.2);
    ctx.strokeStyle = rgba([0, 240, 255], 0.55 + Math.sin(G.t * 6) * 0.2);
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.lineDashOffset = G.t * 18;
    ctx.stroke();
    if (G.selected) {
      const sx = ox + G.selected.c * cell;
      const sy = oy + G.selected.r * cell;
      roundRect(sx + m, sy + m, cell - m * 2, cell - m * 2, cell * 0.2);
      ctx.setLineDash([]);
      ctx.strokeStyle = rgba([255, 227, 107], 0.9);
      ctx.lineWidth = 2.2;
      ctx.stroke();
    }
    if (G.hint && G.phase === 'idle') {
      ctx.setLineDash([]);
      const pulse = 0.35 + Math.sin(G.t * 5) * 0.2;
      for (let i = 0; i < 2; i++) {
        const hr = G.hint[i][0];
        const hc = G.hint[i][1];
        const hx = ox + (hc + 0.5) * cell;
        const hy = oy + (hr + 0.5) * cell;
        ctx.beginPath();
        ctx.arc(hx, hy, cell * 0.46, 0, TAU);
        ctx.strokeStyle = rgba([255, 227, 107], pulse);
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawFx() {
    for (let i = 0; i < beams.length; i++) {
      const b = beams[i];
      const a = b.life / b.max;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      if (b.axis === 'h') {
        const y = oy + (b.i + 0.5) * cell;
        const h = cell * (0.18 + (1 - a) * 0.5);
        const grd = ctx.createLinearGradient(ox, y, ox + boardSize, y);
        grd.addColorStop(0, rgba(b.rgb, 0));
        grd.addColorStop(0.5, rgba([255, 255, 255], 0.85 * a));
        grd.addColorStop(1, rgba(b.rgb, 0));
        ctx.fillStyle = grd;
        ctx.fillRect(ox, y - h / 2, boardSize, h);
        ctx.fillStyle = rgba(b.rgb, 0.35 * a);
        ctx.fillRect(ox, y - h * 0.9, boardSize, h * 1.8);
      } else {
        const x = ox + (b.i + 0.5) * cell;
        const w = cell * (0.18 + (1 - a) * 0.5);
        const grd = ctx.createLinearGradient(x, oy, x, oy + boardSize);
        grd.addColorStop(0, rgba(b.rgb, 0));
        grd.addColorStop(0.5, rgba([255, 255, 255], 0.85 * a));
        grd.addColorStop(1, rgba(b.rgb, 0));
        ctx.fillStyle = grd;
        ctx.fillRect(x - w / 2, oy, w, boardSize);
        ctx.fillStyle = rgba(b.rgb, 0.35 * a);
        ctx.fillRect(x - w * 0.9, oy, w * 1.8, boardSize);
      }
      ctx.restore();
    }
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const t = 1 - r.life / r.max;
      ctx.beginPath();
      ctx.arc(r.x, r.y, cell * (0.2 + t * 0.7), 0, TAU);
      ctx.strokeStyle = rgba(r.rgb, 0.7 * (1 - t));
      ctx.lineWidth = 2.4 * (1 - t);
      ctx.stroke();
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = p.life / p.max;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (0.6 + a * 0.4), 0, TAU);
      ctx.fillStyle = rgba(p.rgb, 0.85 * a);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const p = sparks[i];
      const a = p.life / p.max;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.6 * a, 0, TAU);
      ctx.fillStyle = rgba([255, 255, 255], a);
      ctx.fill();
    }
    ctx.restore();
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 ' + Math.max(12, cell * 0.28) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = Math.min(1, f.life / 0.2) * Math.min(1, f.life / f.max + 0.4);
      ctx.globalAlpha = a;
      ctx.fillStyle = rgba(f.rgb, 1);
      ctx.shadowColor = rgba(f.rgb, 0.8);
      ctx.shadowBlur = 12;
      ctx.font =
        '800 ' +
        Math.max(13, cell * 0.32 * f.scale) +
        'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.restore();
  }

  function draw() {
    ctx.save();
    const jx = fastFx() ? 0 : G.kickX + (Math.random() - 0.5) * G.shake * 0.25;
    const jy = fastFx() ? 0 : G.kickY + (Math.random() - 0.5) * G.shake * 0.25;
    ctx.translate(W / 2, H / 2);
    ctx.scale(G.punch, G.punch);
    ctx.translate(-W / 2 + jx, -H / 2 + jy);
    drawBoardBack();
    const order = gems.slice();
    order.sort(function (a, b) {
      return a.y - b.y || a.id - b.id;
    });
    for (let i = 0; i < order.length; i++) {
      if (!order[i].dead || order[i].popping) drawGem(order[i]);
    }
    drawCursor();
    drawFx();
    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.35);
      ctx.fillRect(ox, oy, boardSize, boardSize);
    }
    ctx.restore();
  }

  function frame(now) {
    if (!lastT) lastT = now;
    let dt = (now - lastT) / 1000;
    lastT = now;
    if (dt > 0.08) dt = 0.08;
    if (!hidden) {
      acc += dt;
      const slice = fastFx() ? dt : STEP;
      let steps = 0;
      while (acc >= slice && steps < 6) {
        step(slice);
        acc -= slice;
        steps += 1;
      }
      if (acc > slice * 3) acc = 0;
      draw();
    }
    requestAnimationFrame(frame);
  }

  function onPtrDown(e) {
    if (e.button != null && e.button !== 0) return;
    audio.ensure();
    if (e.target !== canvas) return;
    const p = eventXY(e);
    const cellHit = cellAt(p.x, p.y);
    ptr.down = true;
    ptr.id = e.pointerId;
    ptr.x = p.x;
    ptr.y = p.y;
    ptr.sx = p.x;
    ptr.sy = p.y;
    ptr.from = cellHit;
    ptr.swapped = false;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (err) { /* ignore */ }
    if (cellHit && G.mode === 'play') {
      G.cursorR = cellHit.r;
      G.cursorC = cellHit.c;
    }
  }

  function onPtrMove(e) {
    if (!ptr.down || (ptr.id != null && e.pointerId !== ptr.id)) return;
    const p = eventXY(e);
    ptr.x = p.x;
    ptr.y = p.y;
    if (autoOn || ptr.swapped || !ptr.from || G.phase !== 'idle' || G.mode !== 'play') return;
    const dx = ptr.x - ptr.sx;
    const dy = ptr.y - ptr.sy;
    const th = cell * 0.26;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < th) return;
    let r2 = ptr.from.r;
    let c2 = ptr.from.c;
    if (Math.abs(dx) > Math.abs(dy)) c2 += dx > 0 ? 1 : -1;
    else r2 += dy > 0 ? 1 : -1;
    if (beginSwap(ptr.from.r, ptr.from.c, r2, c2)) ptr.swapped = true;
  }

  function onPtrUp(e) {
    if (ptr.id != null && e.pointerId !== ptr.id) return;
    const was = ptr.from;
    const swapped = ptr.swapped;
    ptr.down = false;
    ptr.id = null;
    ptr.from = null;
    ptr.swapped = false;
    if (autoOn || swapped || !was) return;
    const p = eventXY(e);
    const hit = cellAt(p.x, p.y);
    if (hit && hit.r === was.r && hit.c === was.c) trySelectOrSwap(hit.r, hit.c);
  }

  function onKey(e) {
    const k = e.key;
    if (k === 'm' || k === 'M') {
      e.preventDefault();
      audio.setMuted(!audio.muted);
      audio.ensure();
      return;
    }
    if (k === 'r' || k === 'R') {
      e.preventDefault();
      retry();
      return;
    }
    if (k === 'a' || k === 'A') {
      if (e.repeat) return;
      e.preventDefault();
      toggleAuto();
      return;
    }
    if (e.target === speedEl) return;
    if (G.mode === 'title' || G.mode === 'over') {
      if (k === '1') {
        e.preventDefault();
        startGame('moves');
      } else if (k === '2') {
        e.preventDefault();
        startGame('time');
      } else if ((k === 'Enter' || k === ' ') && G.mode === 'title') {
        e.preventDefault();
        startGame(G.kind || 'moves');
      } else if ((k === 'Enter' || k === ' ') && G.mode === 'over') {
        e.preventDefault();
        retry();
      }
      return;
    }
    if (G.mode !== 'play') return;
    if (autoOn) {
      if (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown' ||
          k === 'w' || k === 'W' || k === 's' || k === 'S' || k === 'd' || k === 'D' ||
          k === ' ' || k === 'Enter' || k === 'Escape') {
        e.preventDefault();
      }
      return;
    }
    let dr = 0;
    let dc = 0;
    if (k === 'ArrowLeft') dc = -1;
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') dc = 1;
    else if (k === 'ArrowUp' || k === 'w' || k === 'W') dr = -1;
    else if (k === 'ArrowDown' || k === 's' || k === 'S') dr = 1;
    if (dr || dc) {
      e.preventDefault();
      if (
        G.selected &&
        G.selected.r === G.cursorR &&
        G.selected.c === G.cursorC &&
        beginSwap(G.cursorR, G.cursorC, G.cursorR + dr, G.cursorC + dc)
      ) {
        return;
      }
      G.cursorR = clamp(G.cursorR + dr, 0, N - 1);
      G.cursorC = clamp(G.cursorC + dc, 0, N - 1);
      return;
    }
    if (k === ' ' || k === 'Enter') {
      e.preventDefault();
      trySelectOrSwap(G.cursorR, G.cursorC);
    }
    if (k === 'Escape') G.selected = null;
  }

  btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  btnAuto.addEventListener('click', function () {
    toggleAuto();
  });
  btnRetry.addEventListener('click', function () {
    retry();
  });
  speedEl.addEventListener('input', function () {
    setAutoSpeed(parseInt(speedEl.value, 10));
  });
  speedEl.addEventListener('change', function () {
    setAutoSpeed(parseInt(speedEl.value, 10));
  });
  btnMoves.addEventListener('click', function (e) {
    e.stopPropagation();
    startGame('moves');
  });
  btnTime.addEventListener('click', function (e) {
    e.stopPropagation();
    startGame('time');
  });
  overlay.addEventListener('pointerdown', function (e) {
    if (e.target === overlay && G.mode === 'over') {
      overlay.classList.add('hidden');
      overlay.setAttribute('aria-hidden', 'true');
    }
  });

  canvas.addEventListener('pointerdown', onPtrDown);
  canvas.addEventListener('pointermove', onPtrMove);
  canvas.addEventListener('pointerup', onPtrUp);
  canvas.addEventListener('pointercancel', onPtrUp);
  canvas.addEventListener('contextmenu', function (e) {
    e.preventDefault();
  });
  window.addEventListener('keydown', onKey);
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (!hidden) lastT = 0;
  });

  function runBoot() {
    loadBest();
    loadMute();
    loadMode();
    autoSpeed = loadAutoSpeed();
    syncSpeedUI();
    syncAutoBtn();
    resize();
    showTitle();
    hudPlay();
    lastT = 0;
    requestAnimationFrame(frame);
  }

  runBoot();
})();
