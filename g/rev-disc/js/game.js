'use strict';

/* Classic Othello / Reversi on 8×8. Flip every sandwiched line. */

var N = 8;
var EMPTY = 0;
var BLACK = 1;
var WHITE = 2;
var DIRS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1]
];
var POS = [
  120, -20, 20, 5, 5, 20, -20, 120,
  -20, -40, -5, -5, -5, -5, -40, -20,
   20,  -5, 15, 3, 3, 15,  -5,  20,
    5,  -5,  3, 3, 3,  3,  -5,   5,
    5,  -5,  3, 3, 3,  3,  -5,   5,
   20,  -5, 15, 3, 3, 15,  -5,  20,
  -20, -40, -5, -5, -5, -5, -40, -20,
  120, -20, 20, 5, 5, 20, -20, 120
];
var CORNERS = [0, 7, 56, 63];
var XSQ = [9, 14, 49, 54];
var XCORNER = [0, 7, 56, 63];
var BEST_KEY = 'playbox-rev-disc-best';
var MODE_KEY = 'playbox-rev-disc-mode';
var DIFF_KEY = 'playbox-rev-disc-diff';

function opponent(p) {
  return p === BLACK ? WHITE : BLACK;
}

function initialBoard() {
  var b = [];
  var i;
  for (i = 0; i < 64; i++) b[i] = EMPTY;
  b[27] = WHITE;
  b[28] = BLACK;
  b[35] = BLACK;
  b[36] = WHITE;
  return b;
}

function countDiscs(board, p) {
  var n = 0;
  var i;
  for (i = 0; i < 64; i++) if (board[i] === p) n += 1;
  return n;
}

function countEmpty(board) {
  var n = 0;
  var i;
  for (i = 0; i < 64; i++) if (board[i] === EMPTY) n += 1;
  return n;
}

function inBoard(r, c) {
  return r >= 0 && r < N && c >= 0 && c < N;
}

function flipsAt(board, i, player) {
  if (board[i] !== EMPTY) return [];
  var opp = opponent(player);
  var r = (i / N) | 0;
  var c = i % N;
  var out = [];
  var d;
  for (d = 0; d < 8; d++) {
    var dr = DIRS[d][0];
    var dc = DIRS[d][1];
    var rr = r + dr;
    var cc = c + dc;
    var line = [];
    while (inBoard(rr, cc)) {
      var v = board[rr * N + cc];
      if (v === opp) {
        line.push(rr * N + cc);
        rr += dr;
        cc += dc;
        continue;
      }
      if (v === player && line.length) {
        var t;
        for (t = 0; t < line.length; t++) out.push(line[t]);
      }
      break;
    }
  }
  return out;
}

function legalMoves(board, player) {
  var list = [];
  var i;
  for (i = 0; i < 64; i++) {
    var f = flipsAt(board, i, player);
    if (f.length) list.push({ i: i, flips: f });
  }
  return list;
}

function legalIndices(board, player) {
  var list = [];
  var i;
  for (i = 0; i < 64; i++) {
    if (board[i] === EMPTY && flipsAt(board, i, player).length) list.push(i);
  }
  return list;
}

function hasLegal(board, player) {
  var i;
  for (i = 0; i < 64; i++) {
    if (board[i] === EMPTY && flipsAt(board, i, player).length) return true;
  }
  return false;
}

function applyMove(board, i, player) {
  var flips = flipsAt(board, i, player);
  if (!flips.length) return null;
  var next = board.slice();
  next[i] = player;
  var k;
  for (k = 0; k < flips.length; k++) next[flips[k]] = player;
  return next;
}

function bothPass(board) {
  return !hasLegal(board, BLACK) && !hasLegal(board, WHITE);
}

function winnerOf(board) {
  var b = countDiscs(board, BLACK);
  var w = countDiscs(board, WHITE);
  if (b > w) return BLACK;
  if (w > b) return WHITE;
  return 0;
}

function orderMoves(idxs) {
  idxs.sort(function (a, b) { return POS[b] - POS[a]; });
  return idxs;
}

function cornerScore(board, me) {
  var s = 0;
  var k;
  for (k = 0; k < 4; k++) {
    var v = board[CORNERS[k]];
    if (v === me) s += 1;
    else if (v === opponent(me)) s -= 1;
  }
  return s;
}

function xPenalty(board, me) {
  var s = 0;
  var k;
  for (k = 0; k < 4; k++) {
    if (board[XCORNER[k]] !== EMPTY) continue;
    var v = board[XSQ[k]];
    if (v === me) s -= 25;
    else if (v === opponent(me)) s += 25;
  }
  return s;
}

function evaluate(board, me) {
  var opp = opponent(me);
  var empty = 0;
  var myD = 0;
  var opD = 0;
  var pos = 0;
  var i;
  for (i = 0; i < 64; i++) {
    var v = board[i];
    if (v === EMPTY) empty += 1;
    else if (v === me) {
      myD += 1;
      pos += POS[i];
    } else {
      opD += 1;
      pos -= POS[i];
    }
  }
  var myMob = legalIndices(board, me).length;
  var opMob = legalIndices(board, opp).length;
  if (empty === 0 || (myMob === 0 && opMob === 0)) {
    if (myD > opD) return 10000 + (myD - opD);
    if (myD < opD) return -10000 + (myD - opD);
    return 0;
  }
  var mob = myMob - opMob;
  var corners = cornerScore(board, me);
  var xp = xPenalty(board, me);
  if (empty > 44) return pos * 2 + mob * 26 + corners * 80 + xp;
  if (empty > 20) return pos + mob * 18 + corners * 70 + xp + (myD - opD);
  if (empty > 10) return pos + mob * 10 + corners * 50 + (myD - opD) * 8 + xp;
  return (myD - opD) * 22 + mob * 6 + corners * 30;
}

function negamax(board, toMove, depth, alpha, beta) {
  if (depth <= 0) return evaluate(board, toMove);
  var opp = opponent(toMove);
  var moves = legalIndices(board, toMove);
  if (!moves.length) {
    if (!hasLegal(board, opp)) {
      var d = countDiscs(board, toMove) - countDiscs(board, opp);
      if (d > 0) return 10000 + d;
      if (d < 0) return -10000 + d;
      return 0;
    }
    return -negamax(board, opp, depth - 1, -beta, -alpha);
  }
  orderMoves(moves);
  var best = -1e9;
  var k;
  for (k = 0; k < moves.length; k++) {
    var nb = applyMove(board, moves[k], toMove);
    var v = -negamax(nb, opp, depth - 1, -beta, -alpha);
    if (v > best) best = v;
    if (v > alpha) alpha = v;
    if (alpha >= beta) break;
  }
  return best;
}

function bestAtDepth(board, player, depth, rng) {
  var moves = legalIndices(board, player);
  if (!moves.length) return null;
  orderMoves(moves);
  var opp = opponent(player);
  var bestI = moves[0];
  var bestV = -1e9;
  var ties = [bestI];
  var k;
  for (k = 0; k < moves.length; k++) {
    var nb = applyMove(board, moves[k], player);
    var v = depth <= 1
      ? evaluate(nb, player)
      : -negamax(nb, opp, depth - 1, -1e9, 1e9);
    if (v > bestV) {
      bestV = v;
      bestI = moves[k];
      ties = [moves[k]];
    } else if (v === bestV) {
      ties.push(moves[k]);
    }
  }
  if (ties.length > 1 && rng) return ties[(rng() * ties.length) | 0];
  return bestI;
}

function pickAiMove(board, player, level, rng) {
  rng = rng || Math.random;
  var moves = legalIndices(board, player);
  if (!moves.length) return null;
  if (level === 'easy') {
    if (rng() < 0.4) return moves[(rng() * moves.length) | 0];
    return bestAtDepth(board, player, 1, rng);
  }
  if (level === 'mid') return bestAtDepth(board, player, 3, rng);
  var empty = countEmpty(board);
  var depth = 4;
  if (empty <= 14) depth = 5;
  if (empty <= 10) depth = 6;
  return bestAtDepth(board, player, depth, rng);
}

function rc(r, c) {
  return r * N + c;
}

function boardFrom(rows) {
  var b = [];
  var r, c;
  for (r = 0; r < 8; r++) {
    for (c = 0; c < 8; c++) {
      var ch = rows[r].charAt(c);
      b.push(ch === 'b' ? BLACK : ch === 'w' ? WHITE : EMPTY);
    }
  }
  return b;
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assert failed');
}

function sameSet(a, b) {
  if (a.length !== b.length) return false;
  var sa = a.slice().sort(function (x, y) { return x - y; });
  var sb = b.slice().sort(function (x, y) { return x - y; });
  var i;
  for (i = 0; i < sa.length; i++) if (sa[i] !== sb[i]) return false;
  return true;
}

function runSelfTests() {
  var b = initialBoard();
  assert(countDiscs(b, BLACK) === 2 && countDiscs(b, WHITE) === 2, 'start 2-2');
  assert(b[27] === WHITE && b[28] === BLACK && b[35] === BLACK && b[36] === WHITE, 'center');

  var m = legalIndices(b, BLACK);
  assert(m.length === 4, 'black has 4 opening moves, got ' + m.length);
  assert(sameSet(m, [rc(2, 3), rc(3, 2), rc(4, 5), rc(5, 4)]), 'opening squares');

  var wm = legalIndices(b, WHITE);
  assert(sameSet(wm, [rc(2, 4), rc(3, 5), rc(4, 2), rc(5, 3)]), 'white opening if to move');

  assert(applyMove(b, rc(0, 0), BLACK) === null, 'corner illegal at start');
  assert(applyMove(b, 27, BLACK) === null, 'occupied illegal');
  assert(flipsAt(b, rc(2, 2), BLACK).length === 0, 'no diagonal yet');

  var src = b.slice();
  var after = applyMove(b, rc(2, 3), BLACK);
  assert(after, 'd3 legal');
  assert(src[27] === WHITE, 'applyMove does not mutate');
  assert(after[rc(2, 3)] === BLACK, 'placed');
  assert(after[27] === BLACK, 'flipped d4');
  assert(countDiscs(after, BLACK) === 4 && countDiscs(after, WHITE) === 1, '4-1 after d3');
  assert(sameSet(flipsAt(b, rc(2, 3), BLACK), [27]), 'd3 flips only d4');

  /* All 8 directions from a vacant center. */
  var star = [];
  var i;
  for (i = 0; i < 64; i++) star[i] = EMPTY;
  var origin = rc(4, 4);
  var d;
  for (d = 0; d < 8; d++) {
    var dr = DIRS[d][0];
    var dc = DIRS[d][1];
    star[rc(4 + dr, 4 + dc)] = WHITE;
    star[rc(4 + 2 * dr, 4 + 2 * dc)] = WHITE;
    star[rc(4 + 3 * dr, 4 + 3 * dc)] = BLACK;
  }
  var eight = flipsAt(star, origin, BLACK);
  assert(eight.length === 16, '8 dirs × 2 discs, got ' + eight.length);
  for (d = 0; d < 8; d++) {
    dr = DIRS[d][0];
    dc = DIRS[d][1];
    var one = [];
    for (i = 0; i < 64; i++) one[i] = EMPTY;
    one[rc(3 + dr, 3 + dc)] = WHITE;
    one[rc(3 + 2 * dr, 3 + 2 * dc)] = BLACK;
    var oneFlips = flipsAt(one, rc(3, 3), BLACK);
    assert(sameSet(oneFlips, [rc(3 + dr, 3 + dc)]), 'single dir ' + d);
    assert(applyMove(one, rc(3, 3), BLACK)[rc(3 + dr, 3 + dc)] === BLACK, 'single dir applied ' + d);
  }
  var placed = applyMove(star, origin, BLACK);
  assert(placed[origin] === BLACK, 'star place');
  for (d = 0; d < 8; d++) {
    dr = DIRS[d][0];
    dc = DIRS[d][1];
    assert(placed[rc(4 + dr, 4 + dc)] === BLACK, 'dir ' + d + ' first');
    assert(placed[rc(4 + 2 * dr, 4 + 2 * dc)] === BLACK, 'dir ' + d + ' second');
    assert(placed[rc(4 + 3 * dr, 4 + 3 * dc)] === BLACK, 'dir ' + d + ' anchor');
  }

  /* Gap in a line does not flip. */
  var gap = initialBoard();
  for (i = 0; i < 64; i++) gap[i] = EMPTY;
  gap[rc(4, 7)] = BLACK;
  gap[rc(4, 5)] = WHITE;
  /* (4,4) empty, (4,6) empty — cannot jump the hole. */
  assert(flipsAt(gap, rc(4, 4), BLACK).length === 0, 'gap blocks');

  /* Adjacent own disc is not a sandwich. */
  var own = initialBoard();
  for (i = 0; i < 64; i++) own[i] = EMPTY;
  own[rc(4, 5)] = BLACK;
  assert(flipsAt(own, rc(4, 4), BLACK).length === 0, 'no opponent');

  /* Line of opponents with no closer does not wrap. */
  var edge = initialBoard();
  for (i = 0; i < 64; i++) edge[i] = EMPTY;
  edge[rc(4, 5)] = WHITE;
  edge[rc(4, 6)] = WHITE;
  edge[rc(4, 7)] = WHITE;
  assert(flipsAt(edge, rc(4, 4), BLACK).length === 0, 'no closer at edge');

  /* Multi-direction opening-style move later. */
  var multi = boardFrom([
    '........',
    '...b....',
    '..bwb...',
    '.bw.wb..',
    '..bwb...',
    '...b....',
    '........',
    '........'
  ]);
  var mf = flipsAt(multi, rc(3, 3), BLACK);
  assert(sameSet(mf, [rc(2, 3), rc(4, 3), rc(3, 2), rc(3, 4)]), '4-dir flips');
  var mb = applyMove(multi, rc(3, 3), BLACK);
  assert(mb[rc(2, 3)] === BLACK && mb[rc(4, 3)] === BLACK, 'NS flipped');
  assert(mb[rc(3, 2)] === BLACK && mb[rc(3, 4)] === BLACK, 'EW flipped');
  assert(mb[rc(2, 2)] === BLACK && mb[rc(2, 4)] === BLACK, 'anchors stay');

  /* Pass: only empty is index 2; black sandwiches the white at 1, white has no move. */
  var passB = [];
  for (i = 0; i < 64; i++) passB[i] = BLACK;
  passB[1] = WHITE;
  passB[2] = EMPTY;
  assert(hasLegal(passB, BLACK), 'black can play at 2');
  assert(sameSet(legalIndices(passB, BLACK), [2]), 'only index 2');
  assert(!hasLegal(passB, WHITE), 'white must pass');
  assert(!bothPass(passB), 'not both pass');
  var passAfter = applyMove(passB, 2, BLACK);
  assert(passAfter && passAfter[1] === BLACK && passAfter[2] === BLACK, 'pass position flip');

  /* Both pass / no opponent discs. */
  var dead = [];
  for (i = 0; i < 64; i++) dead[i] = BLACK;
  dead[10] = EMPTY;
  assert(!hasLegal(dead, BLACK) && !hasLegal(dead, WHITE), 'both pass');
  assert(bothPass(dead), 'bothPass true');
  assert(winnerOf(dead) === BLACK, 'black wins 63-0');

  /* Full board draw / win. */
  var full = [];
  for (i = 0; i < 64; i++) full[i] = i < 32 ? BLACK : WHITE;
  assert(countEmpty(full) === 0, 'full');
  assert(bothPass(full), 'full is terminal');
  assert(winnerOf(full) === 0, '32-32 draw');
  full[32] = BLACK;
  assert(winnerOf(full) === BLACK, '33-31 black');

  /* Random legal games never accept an illegal place. */
  var t, g, p, mv, k, next;
  for (t = 0; t < 24; t++) {
    g = initialBoard();
    p = BLACK;
    for (k = 0; k < 80; k++) {
      if (bothPass(g)) break;
      mv = legalIndices(g, p);
      if (!mv.length) {
        p = opponent(p);
        continue;
      }
      var pick = mv[(t * 17 + k * 13) % mv.length];
      assert(flipsAt(g, pick, p).length > 0, 'picked legal');
      next = applyMove(g, pick, p);
      assert(next, 'applied');
      assert(next[pick] === p, 'stone placed');
      g = next;
      p = opponent(p);
    }
    assert(bothPass(g) || k === 80, 'game ended or cap');
    assert(countDiscs(g, BLACK) + countDiscs(g, WHITE) + countEmpty(g) === 64, 'partition');
  }

  /* AI returns a legal opening / mid move. */
  var ai0 = pickAiMove(initialBoard(), BLACK, 'hard', function () { return 0; });
  assert(legalIndices(initialBoard(), BLACK).indexOf(ai0) >= 0, 'hard opening legal');
  var ai1 = pickAiMove(initialBoard(), BLACK, 'mid', function () { return 0; });
  assert(legalIndices(initialBoard(), BLACK).indexOf(ai1) >= 0, 'mid opening legal');
  var ai2 = pickAiMove(initialBoard(), BLACK, 'easy', function () { return 0.9; });
  assert(legalIndices(initialBoard(), BLACK).indexOf(ai2) >= 0, 'easy opening legal');

  var afterD3 = applyMove(initialBoard(), rc(2, 3), BLACK);
  var aiW = pickAiMove(afterD3, WHITE, 'hard', function () { return 0; });
  assert(legalIndices(afterD3, WHITE).indexOf(aiW) >= 0, 'white reply legal');

  return 'ok';
}

/* ---------- audio + UI (browser only) ---------- */

if (typeof document === 'undefined') {
  try {
    console.log(runSelfTests());
  } catch (e) {
    console.error(String(e && e.message ? e.message : e));
    if (typeof process !== 'undefined' && process.exit) process.exit(1);
  }
} else {

var boardEl = document.getElementById('board');
var overlayEl = document.getElementById('overlay');
var panelEl = document.getElementById('panel');
var ovTitle = document.getElementById('ov-title');
var ovLead = document.getElementById('ov-lead');
var ovRetry = document.getElementById('ov-retry');
var toastEl = document.getElementById('toast');
var statusEl = document.getElementById('status');
var countBlackEl = document.getElementById('count-black');
var countWhiteEl = document.getElementById('count-white');
var labBlackEl = document.getElementById('lab-black');
var labWhiteEl = document.getElementById('lab-white');
var meterBlack = document.getElementById('meter-black');
var meterWhite = document.getElementById('meter-white');
var bestEl = document.getElementById('best');
var btnMute = document.getElementById('btn-mute');
var btnRetry = document.getElementById('btn-retry');
var modeAiBtn = document.getElementById('mode-ai');
var modePvpBtn = document.getElementById('mode-pvp');
var diffGroup = document.getElementById('diff-group');
var diffEasy = document.getElementById('diff-easy');
var diffMid = document.getElementById('diff-mid');
var diffHard = document.getElementById('diff-hard');
var motionQ = window.matchMedia('(prefers-reduced-motion: reduce)');

var board = initialBoard();
var turn = BLACK;
var status = 'play';
var mode = 'ai';
var diff = 'mid';
var last = -1;
var cursor = rc(2, 3);
var showCursor = false;
var lock = false;
var cellEls = [];
var discEls = [];
var timers = [];
var toastTid = 0;
var aiTid = 0;
var overlayKind = '';
var muted = false;
var actx = null;

function audioCtx() {
  if (!actx) {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    actx = new AC();
  }
  if (actx.state === 'suspended') actx.resume();
  return actx;
}

function beep(freq, dur, vol, type, slide) {
  if (muted) return;
  var ctx = audioCtx();
  if (!ctx) return;
  var t0 = ctx.currentTime;
  var osc = ctx.createOscillator();
  var g = ctx.createGain();
  osc.type = type || 'square';
  osc.frequency.setValueAtTime(freq, t0);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

var sfx = {
  place: function () { beep(640, 0.06, 0.04, 'triangle'); },
  flip: function () { beep(420, 0.08, 0.03, 'sine', 280); },
  deny: function () { beep(180, 0.05, 0.03, 'square'); },
  pass: function () { beep(520, 0.07, 0.035, 'triangle', 360); },
  win: function () {
    beep(392, 0.1, 0.055, 'square', 523);
    later(function () { beep(523, 0.1, 0.055, 'square', 659); }, 90);
    later(function () { beep(784, 0.22, 0.06, 'square'); }, 180);
  },
  lose: function () { beep(180, 0.36, 0.06, 'sawtooth', 70); },
  draw: function () {
    beep(440, 0.1, 0.04, 'triangle');
    later(function () { beep(440, 0.16, 0.04, 'triangle'); }, 140);
  }
};

function reduceMotion() {
  return motionQ.matches;
}

function later(fn, ms) {
  var id = setTimeout(fn, ms);
  timers.push(id);
  return id;
}

function clearTimers() {
  var i;
  for (i = 0; i < timers.length; i++) clearTimeout(timers[i]);
  timers = [];
  if (aiTid) {
    clearTimeout(aiTid);
    aiTid = 0;
  }
  if (toastTid) {
    clearTimeout(toastTid);
    toastTid = 0;
  }
}

function loadBest() {
  try {
    var n = parseInt(localStorage.getItem(BEST_KEY) || '', 10);
    return isFinite(n) && n > 0 ? n : null;
  } catch (e) {
    return null;
  }
}

function saveBest(n) {
  try { localStorage.setItem(BEST_KEY, String(n)); } catch (e) { /* ignore */ }
}

function loadMode() {
  try {
    var v = localStorage.getItem(MODE_KEY);
    if (v === 'pvp' || v === 'ai') return v;
  } catch (e) { /* ignore */ }
  return 'ai';
}

function saveMode(v) {
  try { localStorage.setItem(MODE_KEY, v); } catch (e) { /* ignore */ }
}

function loadDiff() {
  try {
    var v = localStorage.getItem(DIFF_KEY);
    if (v === 'easy' || v === 'mid' || v === 'hard') return v;
  } catch (e) { /* ignore */ }
  return 'mid';
}

function saveDiff(v) {
  try { localStorage.setItem(DIFF_KEY, v); } catch (e) { /* ignore */ }
}

function humanTurn() {
  if (status !== 'play') return false;
  if (mode === 'pvp') return true;
  return turn === BLACK;
}

function overlayOpen() {
  return !overlayEl.classList.contains('hidden');
}

function hideOverlay() {
  overlayEl.classList.add('hidden');
  overlayEl.setAttribute('aria-hidden', 'true');
  panelEl.classList.remove('win', 'lose', 'draw');
}

function showOverlay(kind, title, lead) {
  overlayKind = kind;
  panelEl.classList.remove('win', 'lose', 'draw');
  panelEl.classList.add(kind);
  ovTitle.textContent = title;
  ovLead.textContent = lead || '';
  overlayEl.classList.remove('hidden');
  overlayEl.setAttribute('aria-hidden', 'false');
  ovRetry.focus();
}

function showToast(text) {
  toastEl.textContent = text;
  toastEl.classList.remove('hidden');
  if (toastTid) clearTimeout(toastTid);
  toastTid = setTimeout(function () {
    toastEl.classList.add('hidden');
    toastTid = 0;
  }, 1400);
}

function setStatus(text) {
  statusEl.textContent = text;
}

function paintMeters() {
  var nb = countDiscs(board, BLACK);
  var nw = countDiscs(board, WHITE);
  countBlackEl.textContent = String(nb);
  countWhiteEl.textContent = String(nw);
  var vsAi = mode === 'ai';
  labBlackEl.textContent = vsAi ? '你' : '黑';
  labWhiteEl.textContent = vsAi ? '机' : '白';
  meterBlack.classList.toggle('on', status === 'play' && turn === BLACK);
  meterWhite.classList.toggle('on', status === 'play' && turn === WHITE);
  var best = loadBest();
  bestEl.textContent = best === null ? '—' : String(best);
}

function paintCell(i) {
  var el = cellEls[i];
  var disc = discEls[i];
  var r = (i / N) | 0;
  var c = i % N;
  var v = board[i];
  var cls = 'cell';
  if ((r + c) % 2) cls += ' dark';
  if (showCursor && i === cursor) cls += ' cursor';
  if (last === i) cls += ' last';
  var legal = status === 'play' && !lock && humanTurn() && board[i] === EMPTY &&
    flipsAt(board, i, turn).length > 0;
  if (legal) cls += ' legal';
  el.className = cls;
  if (v === EMPTY) {
    disc.hidden = true;
    disc.className = 'disc';
  } else {
    disc.hidden = false;
    disc.className = 'disc ' + (v === BLACK ? 'black' : 'white');
  }
}

function paintAll() {
  var i;
  for (i = 0; i < 64; i++) paintCell(i);
  document.body.classList.toggle('turn-black', turn === BLACK);
  document.body.classList.toggle('turn-white', turn === WHITE);
  paintMeters();
}

function deny() {
  sfx.deny();
  if (reduceMotion()) return;
  boardEl.classList.remove('deny');
  void boardEl.offsetWidth;
  boardEl.classList.add('deny');
}

function snapCursorToLegal() {
  var moves = legalIndices(board, turn);
  if (!moves.length) return;
  var i;
  for (i = 0; i < moves.length; i++) {
    if (moves[i] === cursor) return;
  }
  var best = moves[0];
  var br = (cursor / N) | 0;
  var bc = cursor % N;
  var bestD = 99;
  for (i = 0; i < moves.length; i++) {
    var r = (moves[i] / N) | 0;
    var c = moves[i] % N;
    var d = Math.abs(r - br) + Math.abs(c - bc);
    if (d < bestD) {
      bestD = d;
      best = moves[i];
    }
  }
  cursor = best;
}

function endGame() {
  status = 'over';
  lock = false;
  var nb = countDiscs(board, BLACK);
  var nw = countDiscs(board, WHITE);
  var who = winnerOf(board);
  document.body.classList.remove('over-black', 'over-white');
  if (who === BLACK) document.body.classList.add('over-black');
  if (who === WHITE) document.body.classList.add('over-white');

  var scoreLine = (mode === 'ai' ? '你 ' : '黑 ') + nb + ' · ' + (mode === 'ai' ? '机 ' : '白 ') + nw;
  var title;
  var kind;
  var lead;

  if (mode === 'ai') {
    if (who === BLACK) {
      kind = 'win';
      title = '赢了';
      var prev = loadBest();
      if (prev === null || nb > prev) {
        saveBest(nb);
        lead = scoreLine + ' · 新纪录';
      } else {
        lead = scoreLine + ' · 最佳 ' + prev;
      }
      sfx.win();
    } else if (who === 0) {
      kind = 'draw';
      title = '平了';
      lead = scoreLine;
      sfx.draw();
    } else {
      kind = 'lose';
      title = '输了';
      lead = scoreLine;
      sfx.lose();
    }
  } else {
    if (who === 0) {
      kind = 'draw';
      title = '平了';
      lead = scoreLine;
      sfx.draw();
    } else {
      kind = 'win';
      title = who === BLACK ? '黑赢了' : '白赢了';
      lead = scoreLine;
      sfx.win();
    }
  }

  setStatus('终局');
  paintAll();
  paintMeters();
  showOverlay(kind, title, lead);
}

function afterMove(player) {
  if (bothPass(board) || countEmpty(board) === 0) {
    endGame();
    return;
  }
  var opp = opponent(player);
  var oppHas = hasLegal(board, opp);
  var meHas = hasLegal(board, player);
  if (!oppHas) {
    if (!meHas) {
      endGame();
      return;
    }
    turn = player;
    var name = opp === BLACK ? (mode === 'ai' ? '你' : '黑') : (mode === 'ai' ? '机' : '白');
    showToast(name + '无子可下，过');
    sfx.pass();
    setStatus(name + '过 · ' + (player === BLACK ? (mode === 'ai' ? '你走' : '黑走') : (mode === 'ai' ? '机走' : '白走')));
    lock = false;
    snapCursorToLegal();
    paintAll();
    if (mode === 'ai' && turn === WHITE) scheduleAi();
    return;
  }
  turn = opp;
  lock = false;
  snapCursorToLegal();
  if (mode === 'ai' && turn === WHITE) {
    setStatus('白思考中');
    paintAll();
    scheduleAi();
    return;
  }
  setStatus(turn === BLACK ? (mode === 'ai' ? '你走' : '黑走') : '白走');
  paintAll();
}

function enactMove(i, player) {
  var flips = flipsAt(board, i, player);
  if (!flips.length) return false;
  lock = true;
  var next = applyMove(board, i, player);
  board = next;
  var prevLast = last;
  last = i;
  cursor = i;
  sfx.place();

  if (reduceMotion()) {
    paintAll();
    later(function () { afterMove(player); }, 40);
    return true;
  }

  var k;
  for (k = 0; k < 64; k++) cellEls[k].classList.remove('legal', 'cursor');
  if (prevLast >= 0 && prevLast !== i) cellEls[prevLast].classList.remove('last');
  paintMeters();

  var placed = discEls[i];
  placed.hidden = false;
  placed.className = 'disc ' + (player === BLACK ? 'black' : 'white') + ' born';
  cellEls[i].classList.add('last');

  flips.sort(function (a, b) {
    var ar = (a / N) | 0, ac = a % N, br = (i / N) | 0, bc = i % N;
    var cr = (b / N) | 0, cc = b % N;
    return (Math.abs(ar - br) + Math.abs(ac - bc)) - (Math.abs(cr - br) + Math.abs(cc - bc));
  });

  if (flips.length) sfx.flip();

  var delay = 70;
  for (k = 0; k < flips.length; k++) {
    (function (idx, wait) {
      later(function () {
        var el = discEls[idx];
        el.hidden = false;
        el.classList.remove('born', 'grow');
        el.classList.add('shrink');
        later(function () {
          el.className = 'disc ' + (player === BLACK ? 'black' : 'white') + ' grow';
        }, 160);
      }, wait);
    })(flips[k], 50 + k * 42);
    delay = 50 + k * 42 + 320;
  }

  later(function () {
    paintAll();
    afterMove(player);
  }, Math.max(delay, 280));
  return true;
}

function scheduleAi() {
  lock = true;
  if (aiTid) clearTimeout(aiTid);
  aiTid = setTimeout(function () {
    aiTid = 0;
    if (status !== 'play' || mode !== 'ai' || turn !== WHITE) {
      lock = false;
      return;
    }
    var i = pickAiMove(board, WHITE, diff);
    if (i == null) {
      lock = false;
      afterMove(WHITE);
      return;
    }
    enactMove(i, WHITE);
  }, 480);
}

function tryPlace(i) {
  if (status !== 'play') return;
  if (lock) return;
  if (!humanTurn()) {
    deny();
    return;
  }
  if (i < 0 || i > 63) return;
  var flips = flipsAt(board, i, turn);
  if (!flips.length) {
    deny();
    return;
  }
  audioCtx();
  enactMove(i, turn);
}

function syncModeUi() {
  modeAiBtn.setAttribute('aria-pressed', mode === 'ai' ? 'true' : 'false');
  modePvpBtn.setAttribute('aria-pressed', mode === 'pvp' ? 'true' : 'false');
  diffEasy.setAttribute('aria-pressed', diff === 'easy' ? 'true' : 'false');
  diffMid.setAttribute('aria-pressed', diff === 'mid' ? 'true' : 'false');
  diffHard.setAttribute('aria-pressed', diff === 'hard' ? 'true' : 'false');
  diffGroup.hidden = mode !== 'ai';
}

function newGame() {
  clearTimers();
  board = initialBoard();
  turn = BLACK;
  status = 'play';
  last = -1;
  cursor = rc(2, 3);
  showCursor = false;
  lock = false;
  overlayKind = '';
  document.body.classList.remove('over-black', 'over-white');
  hideOverlay();
  toastEl.classList.add('hidden');
  setStatus(mode === 'ai' ? '你走 · 黑先' : '黑走');
  syncModeUi();
  paintAll();
  boardEl.focus();
}

function setMode(next) {
  if (next !== 'ai' && next !== 'pvp') return;
  mode = next;
  saveMode(mode);
  newGame();
}

function setDiff(next) {
  if (next !== 'easy' && next !== 'mid' && next !== 'hard') return;
  diff = next;
  saveDiff(diff);
  if (mode === 'ai') newGame();
  else syncModeUi();
}

function buildBoard() {
  boardEl.innerHTML = '';
  cellEls = [];
  discEls = [];
  var frag = document.createDocumentFragment();
  var i;
  for (i = 0; i < 64; i++) {
    var el = document.createElement('div');
    el.className = 'cell';
    el.setAttribute('role', 'gridcell');
    el.dataset.i = String(i);
    var spot = document.createElement('i');
    spot.className = 'spot';
    var disc = document.createElement('span');
    disc.className = 'disc';
    disc.hidden = true;
    el.appendChild(spot);
    el.appendChild(disc);
    frag.appendChild(el);
    cellEls.push(el);
    discEls.push(disc);
  }
  boardEl.appendChild(frag);
}

function cellIndexFromEl(el) {
  if (!el) return -1;
  var cell = el.closest ? el.closest('.cell') : null;
  if (!cell || !boardEl.contains(cell)) return -1;
  return parseInt(cell.dataset.i, 10);
}

function moveCursor(dr, dc) {
  var r = (cursor / N) | 0;
  var c = cursor % N;
  r = (r + dr + N) % N;
  c = (c + dc + N) % N;
  var prev = cursor;
  cursor = rc(r, c);
  showCursor = true;
  paintCell(prev);
  paintCell(cursor);
}

function toggleMute() {
  muted = !muted;
  btnMute.classList.toggle('muted', muted);
  btnMute.textContent = muted ? '静' : '声';
  btnMute.setAttribute('aria-label', muted ? '开启声音' : '静音');
  if (!muted) audioCtx();
}

boardEl.addEventListener('pointerdown', function (ev) {
  if (ev.button !== 0) return;
  var i = cellIndexFromEl(ev.target);
  if (i < 0) return;
  ev.preventDefault();
  showCursor = false;
  try { boardEl.focus({ preventScroll: true }); } catch (e) { boardEl.focus(); }
  audioCtx();
  tryPlace(i);
});

boardEl.addEventListener('contextmenu', function (ev) {
  ev.preventDefault();
});

document.getElementById('stage').addEventListener('pointerdown', function () {
  if (!overlayOpen()) {
    try { boardEl.focus({ preventScroll: true }); } catch (e) { boardEl.focus(); }
  }
});

window.addEventListener('keydown', function (e) {
  var key = e.key;
  var code = e.code;
  if (key === 'm' || key === 'M' || code === 'KeyM') {
    e.preventDefault();
    toggleMute();
    return;
  }
  if (key === 'r' || key === 'R' || code === 'KeyR') {
    e.preventDefault();
    newGame();
    return;
  }
  if (overlayOpen()) return;
  if (key === 'ArrowLeft' || code === 'KeyA') {
    e.preventDefault();
    moveCursor(0, -1);
    return;
  }
  if (key === 'ArrowRight' || code === 'KeyD') {
    e.preventDefault();
    moveCursor(0, 1);
    return;
  }
  if (key === 'ArrowUp' || code === 'KeyW') {
    e.preventDefault();
    moveCursor(-1, 0);
    return;
  }
  if (key === 'ArrowDown' || code === 'KeyS') {
    e.preventDefault();
    moveCursor(1, 0);
    return;
  }
  if (key === ' ' || key === 'Enter') {
    e.preventDefault();
    showCursor = true;
    tryPlace(cursor);
  }
});

btnMute.addEventListener('click', toggleMute);
btnRetry.addEventListener('click', function () { newGame(); });
ovRetry.addEventListener('click', function () { newGame(); });
modeAiBtn.addEventListener('click', function () { setMode('ai'); });
modePvpBtn.addEventListener('click', function () { setMode('pvp'); });
diffEasy.addEventListener('click', function () { setDiff('easy'); });
diffMid.addEventListener('click', function () { setDiff('mid'); });
diffHard.addEventListener('click', function () { setDiff('hard'); });

overlayEl.addEventListener('click', function (e) {
  if (e.target !== overlayEl) return;
  hideOverlay();
});

mode = loadMode();
diff = loadDiff();
buildBoard();
newGame();

}
