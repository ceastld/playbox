'use strict';

(function () {
  const GW = 160;
  const GH = 120;
  const CELL = 4;
  const VW = GW * CELL;
  const VH = GH * CELL;
  const BW = 2;
  const EMPTY = 0;
  const CLAIMED = 1;
  const STIX = 2;
  const LIVES = 3;
  const GOAL = 0.75;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const DX = [0, 1, 0, -1];
  const DY = [-1, 0, 1, 0];
  const BORDER_SPD = 54;
  const FAST_SPD = 42;
  const SLOW_SPD = 18;
  const COMBO_WIN = 4.8;
  const BEST_KEY = 'playbox-qix-cut-best';
  const MUTE_KEY = 'playbox-qix-cut-mute';
  const OPS = '方向键／WASD 游走 · Shift 慢割加倍 · 触屏拖拽 · 别碰上螺旋与火花';

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const VIO = [139, 108, 255];
  const HOT = [255, 90, 130];

  const hasDom = typeof document !== 'undefined';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  function el(id) {
    return hasDom ? document.getElementById(id) : null;
  }

  const canvas = el('c');
  const ctx = canvas ? canvas.getContext('2d', { alpha: false }) : null;
  const overlay = el('overlay');
  const panel = el('panel');
  const ovKicker = el('ov-kicker');
  const ovTitle = el('ov-title');
  const ovLead = el('ov-lead');
  const ovOps = el('ov-ops');
  const ovStart = el('ov-start');
  const ovEnd = el('ov-end');
  const btnClassic = el('btn-classic');
  const btnHelix = el('btn-helix');
  const btnAgain = el('btn-again');
  const btnMenu = el('btn-menu');
  const btnMute = el('btn-mute');
  const btnRetry = el('btn-retry');
  const btnSlow = el('btn-slow');
  const scoreEl = el('score');
  const bestEl = el('best');
  const scoreBox = el('score-box');
  const scoreAdd = el('score-add');
  const pctEl = el('pct');
  const pctBox = el('pct-box');
  const stageLabel = el('stage-label');
  const tagLabel = el('tag-label');
  const comboLabel = el('combo-label');
  const pipsEl = el('pips');
  const toastEl = el('toast');
  const hintEl = el('hint');
  const stageEl = el('stage');

  let W = 1;
  let H = 1;
  let dpr = 1;
  let scale = 1;
  let ox = 0;
  let oy = 0;
  let hidden = false;
  let addTok = 0;
  let kickTok = 0;

  const keys = { n: false, e: false, s: false, w: false, shift: false };
  let lastDir = 1;
  const pointer = { down: false, x: 0, y: 0, id: null };
  const pips = [];
  const particles = [];
  const floaters = [];
  const motes = [];

  const cells = new Uint8Array(GW * GH);
  const fillGlow = new Float32Array(GW * GH);
  const reveal = new Float32Array(GW * GH);

  let fieldC = null;
  let fieldX = null;
  let fieldImg = null;
  if (hasDom) {
    fieldC = document.createElement('canvas');
    fieldC.width = GW;
    fieldC.height = GH;
    fieldX = fieldC.getContext('2d');
    fieldImg = fieldX.createImageData(GW, GH);
  }

  const G = {
    mode: 'title',
    kind: 'classic',
    t: 0,
    clock: 0,
    round: 1,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 1,
    comboT: 0,
    claimed: 0,
    pct: 0,
    px: (GW >> 1),
    py: GH - BW,
    originX: 0,
    originY: 0,
    drawing: false,
    stix: [],
    qixes: [],
    sparks: [],
    moveAcc: 0,
    invuln: 0,
    freeze: 0,
    shake: 0,
    flash: 0,
    flashRgb: VIO,
    punch: 0,
    toastT: 0,
    waveT: 1,
    waveDur: 0,
    fillRgb: CYN,
    slowHold: false,
    clearing: false,
    clearT: 0,
    justPct: 0,
    justT: 0,
    warnT: 0,
    near: 0
  };

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function idx(x, y) {
    return y * GW + x;
  }
  function inb(x, y) {
    return x >= 0 && y >= 0 && x < GW && y < GH;
  }

  function isEmptyAt(buf, w, h, x, y) {
    if (x < 0 || y < 0 || x >= w || y >= h) return false;
    return buf[y * w + x] === EMPTY;
  }

  function isEmpty(x, y) {
    return isEmptyAt(cells, GW, GH, x, y);
  }
  function isClaimed(x, y) {
    if (!inb(x, y)) return true;
    return cells[idx(x, y)] === CLAIMED;
  }
  function isStix(x, y) {
    if (!inb(x, y)) return false;
    return cells[idx(x, y)] === STIX;
  }
  function isEdge(x, y) {
    if (!inb(x, y) || cells[idx(x, y)] !== CLAIMED) return false;
    return isEmpty(x - 1, y) || isEmpty(x + 1, y) || isEmpty(x, y - 1) || isEmpty(x, y + 1)
      || isEmpty(x - 1, y - 1) || isEmpty(x + 1, y - 1) || isEmpty(x - 1, y + 1) || isEmpty(x + 1, y + 1);
  }

  function countClaimedBuf(buf) {
    let n = 0;
    for (let i = 0; i < buf.length; i++) if (buf[i] === CLAIMED) n += 1;
    return n;
  }

  function applyFill(buf, w, h, trail, seeds) {
    for (let i = 0; i < trail.length; i++) {
      const t = trail[i];
      if (t.x >= 0 && t.y >= 0 && t.x < w && t.y < h) buf[t.y * w + t.x] = CLAIMED;
    }
    const keep = new Uint8Array(w * h);
    const q = [];
    function flood(sx, sy) {
      if (sx < 0 || sy < 0 || sx >= w || sy >= h) return;
      const i0 = sy * w + sx;
      if (buf[i0] !== EMPTY || keep[i0]) return;
      keep[i0] = 1;
      q.length = 0;
      q.push(sx, sy);
      for (let qi = 0; qi < q.length; qi += 2) {
        const x = q[qi];
        const y = q[qi + 1];
        const nbs = [x - 1, y, x + 1, y, x, y - 1, x, y + 1];
        for (let k = 0; k < 8; k += 2) {
          const nx = nbs[k];
          const ny = nbs[k + 1];
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const j = ny * w + nx;
          if (buf[j] !== EMPTY || keep[j]) continue;
          keep[j] = 1;
          q.push(nx, ny);
        }
      }
    }
    for (let s = 0; s < seeds.length; s++) {
      let sx = seeds[s].x | 0;
      let sy = seeds[s].y | 0;
      if (!isEmptyAt(buf, w, h, sx, sy)) {
        let found = false;
        const lim = Math.max(w, h);
        for (let r = 1; r < lim && !found; r++) {
          for (let dy = -r; dy <= r && !found; dy++) {
            for (let dx = -r; dx <= r && !found; dx++) {
              const nx = sx + dx;
              const ny = sy + dy;
              if (isEmptyAt(buf, w, h, nx, ny)) {
                sx = nx;
                sy = ny;
                found = true;
              }
            }
          }
        }
        if (!found) continue;
      }
      flood(sx, sy);
    }
    const filled = [];
    for (let i = 0; i < buf.length; i++) {
      if (buf[i] === EMPTY && !keep[i]) {
        buf[i] = CLAIMED;
        filled.push(i);
      }
    }
    return { filled: filled, keep: keep };
  }

  function stampBorder(buf, w, h, bw) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (x < bw || y < bw || x >= w - bw || y >= h - bw) buf[y * w + x] = CLAIMED;
        else buf[y * w + x] = EMPTY;
      }
    }
  }

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    ensure() {
      if (!this.ctx) {
        const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.3;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.3;
      if (btnMute) {
        btnMute.textContent = m ? '静' : '声';
        btnMute.classList.toggle('muted', m);
        btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      }
      try {
        if (hasDom) localStorage.setItem(MUTE_KEY, m ? '1' : '0');
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
    noise(dur, vol, hp) {
      if (!this.ctx || this.muted) return;
      const n = 0.09;
      const sr = this.ctx.sampleRate;
      const buf = this.ctx.createBuffer(1, Math.max(1, (sr * n) | 0), sr);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = hp || 700;
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
    start() {
      this.ensure();
      this.beep(392, 0.08, 'sine', 0.045, 784);
      this.beep(523, 0.14, 'triangle', 0.04, 1046);
    },
    cutStart() {
      this.ensure();
      this.beep(420, 0.07, 'sine', 0.04, 760);
    },
    drawTick(len, slow) {
      this.ensure();
      const f = 480 + Math.min(520, len * 7);
      this.beep(f, 0.03, slow ? 'triangle' : 'sine', slow ? 0.028 : 0.018, f + 80);
    },
    fill(slow, big, combo) {
      this.ensure();
      this.noise(big ? 0.14 : 0.08, big ? 0.055 : 0.032, slow ? 400 : 900);
      const a = slow ? 392 : 523;
      const b = slow ? 587 : 784;
      const c = slow ? 784 : 1046;
      this.beep(a, 0.1, 'sine', 0.05, b);
      this.beep(b, 0.14, 'triangle', 0.045, c);
      if (combo >= 2) this.beep(c * 1.25, 0.12, 'sine', 0.04, c * 1.5);
      if (big) this.beep(c, 0.22, 'sine', 0.05, c * 1.6);
    },
    warn() {
      this.ensure();
      this.beep(180, 0.05, 'square', 0.02, 140);
    },
    die() {
      this.ensure();
      this.noise(0.12, 0.05, 300);
      this.beep(240, 0.16, 'sawtooth', 0.05, 70);
      this.beep(140, 0.26, 'sine', 0.05, 50);
    },
    round() {
      this.ensure();
      this.beep(523, 0.1, 'sine', 0.05);
      this.beep(659, 0.12, 'sine', 0.048);
      this.beep(784, 0.16, 'sine', 0.045);
      this.beep(1046, 0.28, 'triangle', 0.055, 1480);
    },
    extra() {
      this.ensure();
      this.beep(880, 0.1, 'sine', 0.05, 1320);
      this.beep(1320, 0.18, 'triangle', 0.04);
    },
    lose() {
      this.ensure();
      this.beep(196, 0.2, 'sawtooth', 0.04, 80);
      this.beep(110, 0.32, 'sine', 0.05, 40);
    }
  };

  function loadBest() {
    try {
      const n = parseInt(localStorage.getItem(BEST_KEY) || '0', 10);
      G.best = isFinite(n) && n > 0 ? n : 0;
    } catch (err) {
      G.best = 0;
    }
    if (bestEl) bestEl.textContent = String(G.best);
  }

  function saveBest() {
    if (G.score <= G.best) return;
    G.best = G.score;
    if (bestEl) bestEl.textContent = String(G.best);
    try {
      localStorage.setItem(BEST_KEY, String(G.best));
    } catch (err) { /* ignore */ }
  }

  function addScore(n) {
    if (G.mode !== 'play' && G.mode !== 'clear') return;
    if (n <= 0) return;
    G.score += n;
    if (scoreEl) scoreEl.textContent = String(G.score);
    saveBest();
    if (!scoreBox || !scoreAdd) return;
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

  function toast(msg, warn, gold) {
    G.toastT = 1.45;
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold && !warn);
    toastEl.classList.remove('hidden');
  }

  function setHint(text, kind) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', kind === 'hot');
    hintEl.classList.toggle('warn', kind === 'warn');
  }

  function overlayOpen() {
    return overlay && !overlay.classList.contains('hidden');
  }

  function syncPips() {
    if (!pipsEl) return;
    while (pips.length < LIVES) {
      const node = document.createElement('i');
      node.className = 'pip on';
      pipsEl.appendChild(node);
      pips.push(node);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].className = 'pip' + (i < G.lives ? ' on' : ' gone');
    }
  }

  function comboName(n) {
    if (n <= 1) return '×1';
    if (n === 2) return '×2 连割';
    if (n === 3) return '×3 三连';
    if (n === 4) return '×4 狂割';
    return '×' + n + ' 割神';
  }

  function kindName() {
    return G.kind === 'helix' ? '双螺旋' : '经典';
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    const pct = Math.floor(G.pct * 100);
    if (pctEl) pctEl.textContent = pct + '%';
    if (pctBox) pctBox.classList.toggle('hot', G.pct >= 0.6);
    if (comboLabel) {
      comboLabel.textContent = '×' + G.combo;
      comboLabel.classList.toggle('on', G.combo > 1 && G.mode === 'play');
    }
    if (!stageLabel || !tagLabel) return;
    if (G.mode === 'title') {
      stageLabel.textContent = '割域';
      tagLabel.textContent = 'QIX';
    } else {
      stageLabel.textContent = kindName();
      tagLabel.textContent = '第 ' + G.round + ' 轮';
    }
    const win = G.mode === 'clear';
    const lose = G.mode === 'dead';
    stageLabel.classList.toggle('hot', win);
    tagLabel.classList.toggle('hot', win);
    tagLabel.classList.toggle('warn', lose);
    syncPips();
  }

  function syncSlowUi() {
    const on = isSlow();
    if (btnSlow) {
      btnSlow.classList.toggle('on', on);
      btnSlow.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  }

  function showOverlay(kind, title, lead, showEnd) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    if (panel) {
      panel.classList.toggle('win', kind === 'win');
      panel.classList.toggle('lose', kind === 'lose');
    }
    if (ovKicker) ovKicker.textContent = kind === 'win' ? 'CLEAR' : kind === 'lose' ? 'CUT' : 'QIX';
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.innerHTML = lead;
    if (ovOps) ovOps.textContent = OPS;
    if (ovStart) ovStart.classList.toggle('gone', !!showEnd);
    if (ovEnd) ovEnd.classList.toggle('gone', !showEnd);
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (canvas && canvas.focus) canvas.focus();
  }

  function kick(kind) {
    if (!stageEl || REDUCE) return;
    kickTok += 1;
    const tok = kickTok;
    stageEl.classList.remove('die', 'cut');
    void stageEl.offsetWidth;
    stageEl.classList.add(kind === 'die' ? 'die' : 'cut');
    setTimeout(function () {
      if (tok === kickTok && stageEl) stageEl.classList.remove('die', 'cut');
    }, 340);
  }

  function emit(n, spec) {
    if (REDUCE) n = Math.min(n, 5);
    for (let i = 0; i < n; i++) {
      if (particles.length > 180) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life * rand(0.65, 1.2),
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        rgb: spec.rgb || VIO,
        g: spec.g || 0
      });
    }
  }

  function floater(x, y, text, rgb) {
    floaters.push({ x: x, y: y, text: text, life: 0.9, rgb: rgb || GOLD });
  }

  function isSlow() {
    return keys.shift || G.slowHold;
  }

  function qixSpeed() {
    const base = G.kind === 'helix' ? 12.5 : 14.5;
    return base + G.round * 2.3;
  }

  function sparkSpeed() {
    return 10.5 + G.round * 1.7 + (G.kind === 'helix' ? 1.6 : 0);
  }

  function sparkCount() {
    if (G.kind === 'helix') return G.round >= 4 ? 3 : 2;
    return G.round >= 3 ? 3 : 2;
  }

  function qixCount() {
    return G.kind === 'helix' ? 2 : 1;
  }

  function qixLen() {
    const cap = G.kind === 'helix' ? 20 : 24;
    return Math.min(cap, (G.kind === 'helix' ? 12 : 14) + G.round * 1.1);
  }

  function buildField() {
    stampBorder(cells, GW, GH, BW);
    fillGlow.fill(0);
    reveal.fill(0);
    G.stix = [];
    G.drawing = false;
    G.waveT = 1;
    G.waveDur = 0;
    G.claimed = countClaimedBuf(cells);
    G.pct = G.claimed / (GW * GH);
    G.moveAcc = 0;
    G.clearing = false;
    G.clearT = 0;
  }

  function paintDemoClaim() {
    for (let y = GH - 26; y < GH - BW; y++) {
      for (let x = BW; x < 44; x++) {
        if (x <= 20 || y >= GH - 11) cells[idx(x, y)] = CLAIMED;
      }
    }
    for (let y = BW; y < 18; y++) {
      for (let x = GW - 36; x < GW - BW; x++) {
        if (x >= GW - 16 || y <= 10) cells[idx(x, y)] = CLAIMED;
      }
    }
    G.claimed = countClaimedBuf(cells);
    G.pct = G.claimed / (GW * GH);
  }

  function placePlayer() {
    G.px = GW >> 1;
    G.py = GH - BW;
    G.originX = G.px;
    G.originY = G.py;
    G.drawing = false;
    G.stix = [];
    G.moveAcc = 0;
    lastDir = 0;
  }

  function nearestEmpty(x, y) {
    x = x | 0;
    y = y | 0;
    if (isEmpty(x, y)) return { x: x, y: y };
    for (let r = 1; r < 48; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (isEmpty(nx, ny)) return { x: nx, y: ny };
        }
      }
    }
    return null;
  }

  function nearestEdge(x, y) {
    x = x | 0;
    y = y | 0;
    if (isEdge(x, y)) return { x: x, y: y };
    for (let r = 1; r < 64; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (isEdge(nx, ny)) return { x: nx, y: ny };
        }
      }
    }
    return { x: GW >> 1, y: GH - BW };
  }

  function snapPlayer() {
    if (G.drawing) return;
    if (!isEdge(G.px, G.py)) {
      const e = nearestEdge(G.px, G.py);
      G.px = e.x;
      G.py = e.y;
    }
  }

  function makeQix(x, y, rgb, dir) {
    const sp = qixSpeed();
    const ang = dir + rand(-0.5, 0.5);
    return {
      x: x,
      y: y,
      vx: Math.cos(ang) * sp,
      vy: Math.sin(ang) * sp,
      a1: rand(0, TAU),
      a2: rand(0, TAU),
      w1: rand(1.15, 1.85) * (Math.random() < 0.5 ? -1 : 1),
      w2: rand(0.75, 1.35) * (Math.random() < 0.5 ? -1 : 1),
      len: qixLen(),
      phase: rand(0, TAU),
      rgb: rgb
    };
  }

  function spawnQix(forceN) {
    G.qixes = [];
    const n = forceN != null ? forceN : qixCount();
    const spots = n === 1
      ? [{ x: GW * 0.5, y: GH * 0.46 }]
      : [{ x: GW * 0.36, y: GH * 0.4 }, { x: GW * 0.64, y: GH * 0.58 }];
    const cols = n === 1 ? [MAG] : [MAG, CYN];
    for (let i = 0; i < n; i++) {
      const s = spots[i];
      const e = nearestEmpty(s.x, s.y) || s;
      G.qixes.push(makeQix(e.x + 0.5, e.y + 0.5, cols[i], rand(0, TAU)));
    }
  }

  function makeSpark(x, y, dir) {
    return { x: x, y: y, dir: dir, acc: 0, trail: [] };
  }

  function spawnSparks() {
    G.sparks = [];
    const n = G.mode === 'title' ? 2 : sparkCount();
    const a = nearestEdge(BW, BW);
    const b = nearestEdge(GW - BW - 1, BW);
    G.sparks.push(makeSpark(a.x, a.y, 1));
    G.sparks.push(makeSpark(b.x, b.y, 2));
    if (n >= 3) {
      const c = nearestEdge(BW, GH - BW);
      G.sparks.push(makeSpark(c.x, c.y, 0));
    }
  }

  function relocateSparks() {
    for (let i = 0; i < G.sparks.length; i++) {
      const s = G.sparks[i];
      if (!isEdge(s.x, s.y)) {
        const e = nearestEdge(s.x, s.y);
        s.x = e.x;
        s.y = e.y;
      }
    }
  }

  function clearStix() {
    for (let i = 0; i < G.stix.length; i++) {
      const p = G.stix[i];
      if (inb(p.x, p.y) && cells[idx(p.x, p.y)] === STIX) cells[idx(p.x, p.y)] = EMPTY;
    }
    G.stix = [];
    G.drawing = false;
  }

  function vxWorld(x) {
    return (x + 0.5) * CELL;
  }
  function vyWorld(y) {
    return (y + 0.5) * CELL;
  }

  function burstCell(x, y, rgb, n, spd) {
    emit(n, {
      x: vxWorld(x),
      y: vyWorld(y),
      j: 3,
      vx0: -spd,
      vx1: spd,
      vy0: -spd,
      vy1: spd,
      life: 0.45,
      r0: 1.1,
      r1: 2.8,
      rgb: rgb,
      g: 18
    });
  }

  function comboToast(n) {
    if (n < 2) return;
    toast(comboName(n), false, true);
  }

  function completeDraw() {
    const trail = G.stix;
    if (!G.drawing || !trail.length) {
      G.drawing = false;
      G.stix = [];
      return;
    }
    const seeds = [];
    for (let i = 0; i < G.qixes.length; i++) {
      seeds.push({ x: G.qixes[i].x, y: G.qixes[i].y });
    }
    let slowN = 0;
    for (let i = 0; i < trail.length; i++) if (trail[i].slow) slowN += 1;
    const slowRatio = slowN / trail.length;
    const res = applyFill(cells, GW, GH, trail, seeds);
    G.drawing = false;
    G.stix = [];
    G.claimed = countClaimedBuf(cells);
    const prevPct = G.pct;
    G.pct = G.claimed / (GW * GH);
    const extra = res.filled.length;
    const totalNew = extra + trail.length;

    reveal.fill(0);
    const cx = G.px;
    const cy = G.py;
    let maxD = 1;
    const items = [];
    for (let i = 0; i < res.filled.length; i++) {
      const id = res.filled[i];
      const x = id % GW;
      const y = (id / GW) | 0;
      const d = Math.max(Math.abs(x - cx), Math.abs(y - cy));
      items.push({ i: id, d: d });
      if (d > maxD) maxD = d;
    }
    for (let i = 0; i < trail.length; i++) {
      items.push({ i: idx(trail[i].x, trail[i].y), d: 0 });
    }
    const waveDur = clamp(0.12 + items.length * 0.000035, 0.14, 0.38);
    for (let i = 0; i < items.length; i++) {
      reveal[items[i].i] = (items[i].d / maxD) * waveDur;
      fillGlow[items[i].i] = 1;
    }
    G.waveDur = waveDur;
    G.waveT = 0;
    G.fillRgb = slowRatio > 0.55 ? GOLD : slowRatio > 0.2 ? VIO : CYN;

    const freeze = REDUCE ? 0 : clamp(0.036 + totalNew * 0.00001, 0.036, 0.08);
    G.freeze = Math.max(G.freeze, freeze);
    G.shake = REDUCE ? 0 : clamp(4 + totalNew * 0.0022, 5, 14);
    G.punch = REDUCE ? 0 : clamp(0.012 + totalNew * 0.000004, 0.014, 0.045);
    G.flash = slowRatio > 0.55 ? 0.42 : 0.32;
    G.flashRgb = G.fillRgb;
    G.invuln = 0.32;

    if (G.comboT > 0) G.combo += 1;
    else G.combo = 1;
    G.comboT = COMBO_WIN;

    const mult = 1 + 2 * slowRatio;
    const pts = Math.round(totalNew * mult * G.combo);
    addScore(pts);

    const wx = vxWorld(cx);
    const wy = vyWorld(cy);
    const pctGain = (G.pct - prevPct) * 100;
    G.justPct = pctGain;
    G.justT = 0.7;
    floater(wx, wy - 10, '+' + pts, G.fillRgb);
    if (pctGain >= 1) floater(wx + 16, wy + 8, '+' + pctGain.toFixed(1) + '%', GOLD);

    const big = extra > GW * GH * 0.08;
    const rgb = G.fillRgb;
    const sample = Math.min(56, 10 + (trail.length / 2) | 0);
    const step = Math.max(1, (trail.length / sample) | 0);
    for (let i = 0; i < trail.length; i += step) {
      burstCell(trail[i].x, trail[i].y, rgb, big ? 5 : 3, big ? 90 : 55);
    }
    const edgeN = Math.min(48, 8 + (extra / 80) | 0);
    const eStep = Math.max(1, (res.filled.length / edgeN) | 0);
    for (let i = 0; i < res.filled.length; i += eStep) {
      const id = res.filled[i];
      const x = id % GW;
      const y = (id / GW) | 0;
      if (isEmpty(x - 1, y) || isEmpty(x + 1, y) || isEmpty(x, y - 1) || isEmpty(x, y + 1)) {
        burstCell(x, y, rgb, 2, 40);
      }
    }
    if (big) {
      emit(28, {
        x: wx, y: wy, j: 18,
        vx0: -140, vx1: 140, vy0: -140, vy1: 140,
        life: 0.55, r0: 1.4, r1: 3.4, rgb: rgb, g: 10
      });
    }

    audio.fill(slowRatio > 0.45, big, G.combo);
    kick('cut');
    comboToast(G.combo);
    if (slowRatio > 0.7 && extra > 40) toast('慢割', false, true);

    snapPlayer();
    relocateSparks();
    if (pctBox) {
      pctBox.classList.remove('flash');
      void pctBox.offsetWidth;
      pctBox.classList.add('flash');
    }
    if (!G.clearing) setHint('走进空域开割 · 闭合圈地 · 避开螺旋', '');
    syncHud();

    if (G.pct >= 0.9 && prevPct < 0.9) {
      addScore(5000);
      floater(VW * 0.5, VH * 0.42, '完割 +5000', GOLD);
      toast('完割', false, true);
      audio.extra();
      if (G.lives < LIVES) {
        G.lives += 1;
        syncPips();
        toast('补一命', false, true);
      }
    }

    if (G.pct >= GOAL) startClear();
  }

  function startClear() {
    if (G.clearing || G.mode !== 'play') return;
    G.clearing = true;
    G.clearT = 0;
    G.mode = 'clear';
    G.freeze = REDUCE ? 0.2 : 0.55;
    G.flash = 0.55;
    G.flashRgb = GOLD;
    G.shake = REDUCE ? 0 : 10;
    G.punch = REDUCE ? 0 : 0.05;
    const over = Math.max(0, G.pct - GOAL);
    const bonus = 1600 + G.round * 700 + Math.round(over * 12000) + G.lives * 200;
    addScore(bonus);
    floater(VW * 0.5, VH * 0.36, '领域确立 +' + bonus, GOLD);
    toast('领域确立  ' + Math.floor(G.pct * 100) + '%', false, true);
    audio.round();
    kick('cut');
    setHint('第 ' + (G.round + 1) + ' 轮', 'hot');
    syncHud();
  }

  function nextRound() {
    G.round += 1;
    G.combo = Math.max(1, G.combo);
    G.comboT = COMBO_WIN * 0.6;
    buildField();
    placePlayer();
    spawnQix();
    spawnSparks();
    G.mode = 'play';
    G.invuln = 0.55;
    G.freeze = 0.12;
    toast('第 ' + G.round + ' 轮');
    setHint('走进空域开割 · 闭合圈地 · 避开螺旋', '');
    syncHud();
  }

  function die(reason) {
    if (G.mode !== 'play') return;
    if (G.invuln > 0) return;
    const wx = vxWorld(G.px);
    const wy = vyWorld(G.py);
    emit(36, {
      x: wx, y: wy, j: 6,
      vx0: -160, vx1: 160, vy0: -170, vy1: 80,
      life: 0.55, r0: 1.4, r1: 3.6, rgb: HOT, g: 40
    });
    emit(12, {
      x: wx, y: wy, j: 4,
      vx0: -80, vx1: 80, vy0: -90, vy1: 40,
      life: 0.35, r0: 1, r1: 2.2, rgb: GOLD, g: 10
    });
    audio.die();
    kick('die');
    G.shake = REDUCE ? 0 : 12;
    G.flash = 0.5;
    G.flashRgb = HOT;
    G.freeze = REDUCE ? 0 : 0.07;
    G.combo = 1;
    G.comboT = 0;
    const ox_ = G.originX;
    const oy_ = G.originY;
    clearStix();
    if (reason !== 'spark') {
      G.px = ox_;
      G.py = oy_;
    }
    snapPlayer();
    G.lives -= 1;
    G.invuln = 1.15;
    toast(reason === 'qix' ? '螺旋割中' : reason === 'cross' ? '割线自交' : '火花碰上', true, false);
    setHint('性命 -1', 'warn');
    syncHud();
    if (G.lives <= 0) gameOver();
  }

  function gameOver() {
    G.mode = 'dead';
    G.drawing = false;
    saveBest();
    audio.lose();
    const pct = Math.floor(G.pct * 100);
    showOverlay(
      'lose',
      '命尽',
      '第 ' + G.round + ' 轮 · 领域 ' + pct + '%<br />得分 ' + G.score + (G.score >= G.best && G.score > 0 ? ' · 新纪录' : ''),
      true
    );
    setHint('R 再割 · 换模式回标题', 'warn');
    syncHud();
  }

  function bootTitle() {
    G.mode = 'title';
    G.kind = 'classic';
    G.round = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 1;
    G.comboT = 0;
    G.invuln = 0;
    G.clearing = false;
    buildField();
    paintDemoClaim();
    placePlayer();
    spawnQix(1);
    spawnSparks();
    showOverlay(
      'title',
      '割域',
      '贴边游走，按住方向走进空域画出割线。<br />闭合回已占边，圈住螺旋对面的那一块。慢割分高。',
      false
    );
    setHint('走进空域开割 · 闭合圈地 · Shift 慢割 · 避开螺旋', '');
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'helix' ? 'helix' : 'classic';
    G.round = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 1;
    G.comboT = 0;
    G.invuln = 0.4;
    G.freeze = 0.08;
    G.clearing = false;
    buildField();
    placePlayer();
    spawnQix();
    spawnSparks();
    G.mode = 'play';
    hideOverlay();
    audio.start();
    toast(kindName());
    setHint('走进空域开割 · 闭合圈地 · 避开螺旋', '');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('classic');
    else startGame(G.kind);
  }

  function desiredDir() {
    if (keys.n || keys.e || keys.s || keys.w) {
      if (lastDir === 0 && keys.n) return 0;
      if (lastDir === 1 && keys.e) return 1;
      if (lastDir === 2 && keys.s) return 2;
      if (lastDir === 3 && keys.w) return 3;
      if (keys.n) return 0;
      if (keys.e) return 1;
      if (keys.s) return 2;
      if (keys.w) return 3;
    }
    if (pointer.down) {
      const dx = pointer.x - G.px;
      const dy = pointer.y - G.py;
      if (Math.abs(dx) < 0.35 && Math.abs(dy) < 0.35) return -1;
      if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? 1 : 3;
      return dy > 0 ? 2 : 0;
    }
    return -1;
  }

  function altDir() {
    if (!pointer.down) return -1;
    const dx = pointer.x - G.px;
    const dy = pointer.y - G.py;
    if (Math.abs(dx) >= Math.abs(dy)) {
      if (Math.abs(dy) < 0.35) return -1;
      return dy > 0 ? 2 : 0;
    }
    if (Math.abs(dx) < 0.35) return -1;
    return dx > 0 ? 1 : 3;
  }

  function startDraw(nx, ny) {
    G.drawing = true;
    G.originX = G.px;
    G.originY = G.py;
    G.px = nx;
    G.py = ny;
    cells[idx(nx, ny)] = STIX;
    G.stix = [{ x: nx, y: ny, slow: isSlow() }];
    audio.cutStart();
    burstCell(nx, ny, isSlow() ? GOLD : CYN, 6, 40);
    setHint(isSlow() ? '慢割中 · 闭合回边' : '开割中 · Shift 慢割加倍', 'hot');
  }

  function tryStep(dir) {
    const nx = G.px + DX[dir];
    const ny = G.py + DY[dir];
    if (!inb(nx, ny)) return false;
    if (G.drawing) {
      if (isStix(nx, ny)) {
        const prev = G.stix.length >= 2 ? G.stix[G.stix.length - 2] : { x: G.originX, y: G.originY };
        if (nx === prev.x && ny === prev.y) return false;
        die('cross');
        return true;
      }
      if (isEmpty(nx, ny)) {
        const prevX = G.px;
        const prevY = G.py;
        G.px = nx;
        G.py = ny;
        cells[idx(nx, ny)] = STIX;
        const slow = isSlow();
        G.stix.push({ x: nx, y: ny, slow: slow });
        lastDir = dir;
        if (G.stix.length % 6 === 0) audio.drawTick(G.stix.length, slow);
        emit(slow ? 2 : 1, {
          x: vxWorld(prevX), y: vyWorld(prevY), j: 1.2,
          vx0: -18, vx1: 18, vy0: -18, vy1: 18,
          life: 0.28, r0: 0.8, r1: 1.8,
          rgb: slow ? GOLD : CYN, g: 0
        });
        return true;
      }
      if (isClaimed(nx, ny)) {
        G.px = nx;
        G.py = ny;
        lastDir = dir;
        completeDraw();
        return true;
      }
      return false;
    }
    if (isEmpty(nx, ny)) {
      startDraw(nx, ny);
      lastDir = dir;
      return true;
    }
    if (isEdge(nx, ny)) {
      G.px = nx;
      G.py = ny;
      lastDir = dir;
      return true;
    }
    return false;
  }

  function stepPlayer() {
    const dir = desiredDir();
    if (dir < 0) return;
    if (tryStep(dir)) return;
    const alt = altDir();
    if (alt >= 0 && alt !== dir) tryStep(alt);
  }

  function playerSpeed() {
    if (G.drawing) return isSlow() ? SLOW_SPD : FAST_SPD;
    return BORDER_SPD;
  }

  function bounceQix(q, dt) {
    const sp = qixSpeed();
    let nx = q.x + q.vx * dt;
    let ny = q.y + q.vy * dt;
    const ix = nx | 0;
    const iy = q.y | 0;
    const jx = q.x | 0;
    const jy = ny | 0;
    let hit = false;
    if (!isEmpty(ix, iy)) {
      q.vx *= -1;
      nx = q.x;
      hit = true;
    }
    if (!isEmpty(jx, jy)) {
      q.vy *= -1;
      ny = q.y;
      hit = true;
    }
    q.x = nx;
    q.y = ny;
    if (!isEmpty(q.x | 0, q.y | 0)) {
      const e = nearestEmpty(q.x, q.y);
      if (e) {
        q.x = e.x + 0.5;
        q.y = e.y + 0.5;
      }
      q.vx *= -1;
      q.vy *= -1;
      hit = true;
    }
    if (hit) {
      q.vx += rand(-3, 3);
      q.vy += rand(-3, 3);
    }
    const m = hypot(q.vx, q.vy) || 1;
    q.vx = q.vx / m * sp;
    q.vy = q.vy / m * sp;
    q.a1 += q.w1 * dt;
    q.a2 += q.w2 * dt;
    q.len = qixLen() + Math.sin(G.clock * 2.1 + q.phase) * 2.6;
  }

  function sampleQixHit(q) {
    const arms = [q.a1, q.a2];
    const lens = [q.len, q.len * 0.92];
    let near = 1e9;
    for (let a = 0; a < 2; a++) {
      const c = Math.cos(arms[a]);
      const s = Math.sin(arms[a]);
      const len = lens[a];
      const n = Math.max(8, (len * 2.4) | 0);
      for (let i = 0; i <= n; i++) {
        const t = -len + (2 * len * i) / n;
        const px = q.x + c * t;
        const py = q.y + s * t;
        const ix = px | 0;
        const iy = py | 0;
        if (isStix(ix, iy)) return { hit: true, near: 0 };
        if (G.drawing) {
          const d = hypot(px - (G.px + 0.5), py - (G.py + 0.5));
          if (d < 0.85) return { hit: true, near: 0 };
          if (d < near) near = d;
          if (isStix(ix - 1, iy) || isStix(ix + 1, iy) || isStix(ix, iy - 1) || isStix(ix, iy + 1)) {
            if (near > 1.2) near = 1.2;
          }
        }
      }
    }
    return { hit: false, near: near };
  }

  function qixKills() {
    if (G.mode !== 'play' || G.invuln > 0) return;
    let closest = 1e9;
    for (let i = 0; i < G.qixes.length; i++) {
      const r = sampleQixHit(G.qixes[i]);
      if (r.hit) {
        die('qix');
        return;
      }
      if (r.near < closest) closest = r.near;
    }
    G.near = closest;
    if (G.drawing && closest < 7) {
      G.warnT += STEP;
      if (G.warnT > 0.16) {
        G.warnT = 0;
        audio.warn();
      }
    } else G.warnT = 0;
  }

  function sparkStep(s) {
    const order = [s.dir, (s.dir + 1) & 3, (s.dir + 3) & 3, (s.dir + 2) & 3];
    for (let i = 0; i < 4; i++) {
      const d = order[i];
      const nx = s.x + DX[d];
      const ny = s.y + DY[d];
      if (isEdge(nx, ny)) {
        s.trail.push({ x: s.x, y: s.y });
        if (s.trail.length > 7) s.trail.shift();
        s.x = nx;
        s.y = ny;
        s.dir = d;
        return;
      }
    }
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = s.x + dx;
        const ny = s.y + dy;
        if (isEdge(nx, ny)) {
          s.trail.push({ x: s.x, y: s.y });
          if (s.trail.length > 7) s.trail.shift();
          s.x = nx;
          s.y = ny;
          if (dx === 1 && !dy) s.dir = 1;
          else if (dx === -1 && !dy) s.dir = 3;
          else if (dy === 1 && !dx) s.dir = 2;
          else if (dy === -1 && !dx) s.dir = 0;
          return;
        }
      }
    }
    const e = nearestEdge(s.x, s.y);
    s.x = e.x;
    s.y = e.y;
  }

  function sparksKill() {
    if (G.mode !== 'play' || G.invuln > 0) return;
    if (G.drawing) return;
    for (let i = 0; i < G.sparks.length; i++) {
      const s = G.sparks[i];
      if (s.x === G.px && s.y === G.py) {
        die('spark');
        return;
      }
    }
  }

  function updateFx(dt) {
    G.clock += dt;
    G.t += dt;
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0 && toastEl) toastEl.classList.add('hidden');
    }
    if (G.invuln > 0) G.invuln -= dt;
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.punch > 0) G.punch = Math.max(0, G.punch - dt * 0.18);
    if (G.justT > 0) G.justT -= dt;
    if (G.comboT > 0 && G.mode === 'play') {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 1;
        if (comboLabel) comboLabel.classList.remove('on');
      }
    }
    G.waveT += dt;
    for (let i = 0; i < fillGlow.length; i++) {
      if (fillGlow[i] > 0) fillGlow[i] = Math.max(0, fillGlow[i] - dt * 0.85);
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
      p.vx *= 0.98;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = floaters.length - 1; i >= 0; i--) {
      const f = floaters[i];
      f.life -= dt;
      f.y -= 28 * dt;
      if (f.life <= 0) floaters.splice(i, 1);
    }
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      m.p += dt * m.s;
      m.x += Math.cos(m.p) * m.d * dt;
      m.y += Math.sin(m.p * 0.7) * m.d * dt;
      if (m.x < 8) m.x = VW - 8;
      if (m.x > VW - 8) m.x = 8;
      if (m.y < 8) m.y = VH - 8;
      if (m.y > VH - 8) m.y = 8;
    }
  }

  function updateQixes(dt) {
    for (let i = 0; i < G.qixes.length; i++) bounceQix(G.qixes[i], dt);
    if (G.qixes.length >= 2) {
      const a = G.qixes[0];
      const b = G.qixes[1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = hypot(dx, dy);
      if (d < 8 && d > 0.1) {
        const push = (8 - d) * 0.6;
        a.vx -= dx / d * push;
        a.vy -= dy / d * push;
        b.vx += dx / d * push;
        b.vy += dy / d * push;
      }
    }
  }

  function updateSparks(dt) {
    const sp = G.mode === 'title' ? 14 : sparkSpeed();
    for (let i = 0; i < G.sparks.length; i++) {
      const s = G.sparks[i];
      s.acc += dt * sp;
      let guard = 0;
      while (s.acc >= 1 && guard < 4) {
        s.acc -= 1;
        sparkStep(s);
        guard += 1;
      }
    }
  }

  function updatePlayer(dt) {
    if (G.mode !== 'play') return;
    G.moveAcc += dt * playerSpeed();
    let guard = 0;
    while (G.moveAcc >= 1 && guard < 5) {
      G.moveAcc -= 1;
      stepPlayer();
      guard += 1;
      if (G.mode !== 'play') break;
    }
  }

  function update(dt) {
    updateFx(dt);
    if (G.mode === 'clear') {
      G.clearT += dt;
      updateQixes(dt * 0.25);
      if (G.clearT > 1.25) nextRound();
      return;
    }
    if (G.freeze > 0) {
      G.freeze -= dt;
      if (G.mode === 'title') {
        updateQixes(dt);
        updateSparks(dt);
      }
      return;
    }
    if (G.mode === 'dead') {
      updateQixes(dt * 0.35);
      return;
    }
    if (G.mode === 'title') {
      updateQixes(dt);
      updateSparks(dt);
      return;
    }
    if (G.mode === 'play') {
      updatePlayer(dt);
      if (G.mode !== 'play') return;
      updateQixes(dt);
      updateSparks(dt);
      qixKills();
      sparksKill();
    }
  }

  function paintField() {
    if (!fieldImg || !fieldX) return;
    const d = fieldImg.data;
    const t = (G.clock * 9) | 0;
    for (let y = 0, i = 0, p = 0; y < GH; y++) {
      for (let x = 0; x < GW; x++, i++, p += 4) {
        const c = cells[i];
        const hiddenCell = c === CLAIMED && G.waveT < reveal[i];
        if (c === EMPTY || hiddenCell || c === STIX) {
          const n = (x * 19 + y * 7 + t) & 8 ? 1 : 0;
          d[p] = 8 + n * 5;
          d[p + 1] = 6 + n * 3;
          d[p + 2] = 22 + n * 8;
          d[p + 3] = 255;
        } else {
          const edge = isEmpty(x - 1, y) || isEmpty(x + 1, y) || isEmpty(x, y - 1) || isEmpty(x, y + 1);
          let r = edge ? 78 : 42;
          let g0 = edge ? 54 : 26;
          let b = edge ? 178 : 108;
          const gl = fillGlow[i];
          if (gl > 0) {
            r = r + (G.fillRgb[0] - r) * gl;
            g0 = g0 + (G.fillRgb[1] - g0) * gl;
            b = b + (G.fillRgb[2] - b) * gl;
          }
          d[p] = r;
          d[p + 1] = g0;
          d[p + 2] = b;
          d[p + 3] = 255;
        }
      }
    }
    fieldX.putImageData(fieldImg, 0, 0);
  }

  function strokeGlow(x0, y0, x1, y1, rgb, w, a) {
    ctx.strokeStyle = rgba(rgb, a);
    ctx.lineWidth = w;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }

  function drawStix() {
    if (!G.drawing || G.stix.length < 1) return;
    const pts = [{ x: G.originX, y: G.originY }].concat(G.stix);
    const slowN = G.stix.filter(function (p) { return p.slow; }).length;
    const rgb = slowN / G.stix.length > 0.5 ? GOLD : CYN;
    const pulse = 0.72 + Math.sin(G.clock * 14) * 0.2;
    ctx.save();
    ctx.lineJoin = 'round';
    for (let pass = 0; pass < 3; pass++) {
      const w = pass === 0 ? 10 : pass === 1 ? 4.2 : 1.6;
      const a = pass === 0 ? 0.16 * pulse : pass === 1 ? 0.55 * pulse : 0.95;
      const col = pass === 2 ? [255, 255, 255] : rgb;
      ctx.strokeStyle = rgba(col, a);
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(vxWorld(pts[0].x), vyWorld(pts[0].y));
      for (let i = 1; i < pts.length; i++) ctx.lineTo(vxWorld(pts[i].x), vyWorld(pts[i].y));
      ctx.stroke();
    }
    ctx.restore();
    if (G.near < 6.5) {
      ctx.save();
      ctx.strokeStyle = rgba(HOT, 0.35 + Math.sin(G.clock * 22) * 0.2);
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(vxWorld(pts[0].x), vyWorld(pts[0].y));
      for (let i = 1; i < pts.length; i++) ctx.lineTo(vxWorld(pts[i].x), vyWorld(pts[i].y));
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawQix(q) {
    const x = vxWorld(q.x - 0.5);
    const y = vyWorld(q.y - 0.5);
    const rgb = q.rgb || MAG;
    const arms = [q.a1, q.a2];
    const lens = [q.len * CELL, q.len * 0.92 * CELL];
    for (let a = 0; a < 2; a++) {
      const c = Math.cos(arms[a]);
      const s = Math.sin(arms[a]);
      const len = lens[a];
      const x0 = x - c * len;
      const y0 = y - s * len;
      const x1 = x + c * len;
      const y1 = y + s * len;
      strokeGlow(x0, y0, x1, y1, rgb, 11, 0.12);
      strokeGlow(x0, y0, x1, y1, rgb, 4.5, 0.55);
      strokeGlow(x0, y0, x1, y1, [255, 220, 255], 1.5, 0.9);
    }
    ctx.save();
    ctx.fillStyle = rgba(rgb, 0.22);
    ctx.beginPath();
    ctx.arc(x, y, 10 + Math.sin(G.clock * 6 + q.phase) * 2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba([255, 255, 255], 0.95);
    ctx.beginPath();
    ctx.arc(x, y, 2.2, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawSpark(s) {
    const x = vxWorld(s.x);
    const y = vyWorld(s.y);
    for (let i = 0; i < s.trail.length; i++) {
      const t = s.trail[i];
      const a = ((i + 1) / (s.trail.length + 1)) * 0.45;
      ctx.fillStyle = rgba(GOLD, a);
      ctx.beginPath();
      ctx.arc(vxWorld(t.x), vyWorld(t.y), 1.4 + i * 0.25, 0, TAU);
      ctx.fill();
    }
    const pulse = 2.4 + Math.sin(G.clock * 18 + s.x) * 0.5;
    ctx.fillStyle = rgba(GOLD, 0.28);
    ctx.beginPath();
    ctx.arc(x, y, pulse * 2.1, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba([255, 250, 210], 0.95);
    ctx.beginPath();
    ctx.arc(x, y, pulse, 0, TAU);
    ctx.fill();
  }

  function drawMarker() {
    if (G.mode === 'title' || G.mode === 'dead') return;
    if (G.invuln > 0 && ((G.clock * 18) | 0) % 2 === 0) return;
    const x = vxWorld(G.px);
    const y = vyWorld(G.py);
    const rgb = G.drawing ? (isSlow() ? GOLD : CYN) : VIO;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4 + lastDir * Math.PI / 2 * 0);
    ctx.shadowColor = rgba(rgb, 0.9);
    ctx.shadowBlur = 12;
    ctx.fillStyle = rgba(rgb, 0.28);
    ctx.fillRect(-9.5, -9.5, 19, 19);
    ctx.fillStyle = rgba(rgb, 0.95);
    ctx.fillRect(-5.2, -5.2, 10.4, 10.4);
    ctx.fillStyle = '#fff';
    ctx.fillRect(-2, -2, 4, 4);
    ctx.restore();
    if (G.drawing) {
      ctx.strokeStyle = rgba(rgb, 0.35);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(x, y, 9 + Math.sin(G.clock * 10) * 1.5, 0, TAU);
      ctx.stroke();
    }
  }

  function drawBar() {
    const x0 = 36;
    const y0 = 8;
    const bw = VW - 72;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(x0, y0, bw, 5);
    const g = ctx.createLinearGradient(x0, 0, x0 + bw, 0);
    g.addColorStop(0, rgba(VIO, 0.85));
    g.addColorStop(0.55, rgba(MAG, 0.9));
    g.addColorStop(1, rgba(GOLD, 0.95));
    ctx.fillStyle = g;
    ctx.fillRect(x0, y0, bw * clamp(G.pct, 0, 1), 5);
    const tick = x0 + bw * GOAL;
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.fillRect(tick - 1, y0 - 2, 2, 9);
    ctx.restore();
  }

  function draw() {
    if (!ctx) return;
    paintField();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#05030c';
    ctx.fillRect(0, 0, W, H);
    const sx = G.shake && !REDUCE ? rand(-G.shake, G.shake) * scale * 0.15 : 0;
    const sy = G.shake && !REDUCE ? rand(-G.shake, G.shake) * scale * 0.15 : 0;
    const punch = 1 + G.punch;
    ctx.save();
    ctx.translate(ox + VW * scale * 0.5 + sx, oy + VH * scale * 0.5 + sy);
    ctx.scale(scale * punch, scale * punch);
    ctx.translate(-VW * 0.5, -VH * 0.5);

    ctx.fillStyle = '#07051a';
    ctx.fillRect(-2, -2, VW + 4, VH + 4);
    ctx.imageSmoothingEnabled = false;
    if (fieldC) ctx.drawImage(fieldC, 0, 0, VW, VH);
    ctx.imageSmoothingEnabled = true;

    ctx.save();
    ctx.strokeStyle = rgba(VIO, 0.35);
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, VW - 3, VH - 3);
    ctx.restore();

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      ctx.fillStyle = rgba(m.rgb, m.a * (0.55 + Math.sin(m.p) * 0.45));
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, TAU);
      ctx.fill();
    }

    drawStix();
    for (let i = 0; i < G.qixes.length; i++) drawQix(G.qixes[i]);
    for (let i = 0; i < G.sparks.length; i++) drawSpark(G.sparks[i]);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * a, 0, TAU);
      ctx.fill();
    }

    drawMarker();

    ctx.save();
    ctx.font = '700 13px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < floaters.length; i++) {
      const f = floaters[i];
      ctx.fillStyle = rgba(f.rgb, clamp(f.life * 1.4, 0, 1));
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.restore();

    if (G.justT > 0 && G.justPct >= 2) {
      ctx.save();
      ctx.font = '900 42px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = rgba(G.fillRgb, G.justT * 0.7);
      ctx.fillText('+' + G.justPct.toFixed(1) + '%', VW * 0.5, VH * 0.28);
      ctx.restore();
    }

    drawBar();

    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.22);
      ctx.fillRect(0, 0, VW, VH);
    }

    ctx.restore();
  }

  function seedMotes() {
    motes.length = 0;
    for (let i = 0; i < 40; i++) {
      motes.push({
        x: rand(16, VW - 16),
        y: rand(16, VH - 16),
        r: rand(0.5, 1.5),
        a: rand(0.04, 0.14),
        p: rand(0, TAU),
        s: rand(0.4, 1.2),
        d: rand(4, 14),
        rgb: Math.random() < 0.5 ? VIO : MAG
      });
    }
  }

  function eventToGrid(e) {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) * (canvas.width / Math.max(1, r.width));
    const y = (e.clientY - r.top) * (canvas.height / Math.max(1, r.height));
    const gx = (x - ox) / (scale * CELL) - 0.5;
    const gy = (y - oy) / (scale * CELL) - 0.5;
    return { x: gx, y: gy };
  }

  function dirFromCode(code, key) {
    if (code === 'ArrowUp' || key === 'w' || key === 'W') return 0;
    if (code === 'ArrowRight' || key === 'd' || key === 'D') return 1;
    if (code === 'ArrowDown' || key === 's' || key === 'S') return 2;
    if (code === 'ArrowLeft' || key === 'a' || key === 'A') return 3;
    return -1;
  }

  function onKey(e, down) {
    const dir = dirFromCode(e.code, e.key);
    if (dir >= 0) {
      if (dir === 0) keys.n = down;
      if (dir === 1) keys.e = down;
      if (dir === 2) keys.s = down;
      if (dir === 3) keys.w = down;
      if (down) lastDir = dir;
      e.preventDefault();
      return;
    }
    if (down && e.repeat) return;
    if (e.key === 'Shift') {
      keys.shift = down;
      syncSlowUi();
      e.preventDefault();
      return;
    }
    if (!down) return;
    if (e.key === 'm' || e.key === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      e.preventDefault();
      return;
    }
    if (e.key === 'r' || e.key === 'R') {
      restart();
      e.preventDefault();
      return;
    }
    if (e.key === 'Escape') {
      audio.ensure();
      bootTitle();
      e.preventDefault();
      return;
    }
    if (overlayOpen() && G.mode === 'title') {
      if (e.key === '1' || e.key === 'Enter') {
        audio.ensure();
        startGame('classic');
        e.preventDefault();
      } else if (e.key === '2') {
        audio.ensure();
        startGame('helix');
        e.preventDefault();
      }
      return;
    }
    if (overlayOpen() && G.mode === 'dead') {
      if (e.key === 'Enter') {
        restart();
        e.preventDefault();
      }
    }
  }

  function selfCheck() {
    const w = 7;
    const h = 7;
    const buf = new Uint8Array(w * h);
    stampBorder(buf, w, h, 1);
    const trail = [];
    for (let x = 1; x <= 5; x++) trail.push({ x: x, y: 3 });
    const r1 = applyFill(buf, w, h, trail, [{ x: 3, y: 1 }]);
    if (r1.filled.length !== 10) throw new Error('fill should claim the side without qix, got ' + r1.filled.length);
    if (buf[4 * w + 3] !== CLAIMED) throw new Error('bottom interior should be claimed');
    if (buf[1 * w + 3] !== EMPTY) throw new Error('qix side should stay empty');

    const buf2 = new Uint8Array(w * h);
    stampBorder(buf2, w, h, 1);
    const r2 = applyFill(buf2, w, h, trail, [{ x: 3, y: 1 }, { x: 3, y: 5 }]);
    if (r2.filled.length !== 0) throw new Error('two qix on both sides should fill only the trail');
    if (buf2[3 * w + 3] !== CLAIMED) throw new Error('trail itself must become claimed');
    if (buf2[1 * w + 3] !== EMPTY || buf2[5 * w + 3] !== EMPTY) throw new Error('both qix pockets stay empty');

    const buf3 = new Uint8Array(w * h);
    stampBorder(buf3, w, h, 1);
    const bite = [{ x: 2, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 4, y: 1 }];
    const r3 = applyFill(buf3, w, h, bite, [{ x: 3, y: 4 }]);
    if (r3.filled.length < 1) throw new Error('a bite away from qix should fill something');
    if (buf3[1 * w + 3] !== CLAIMED) throw new Error('bite pocket should fill');
    if (buf3[4 * w + 3] !== EMPTY) throw new Error('qix side of bite should remain');

    const n = countClaimedBuf(buf3);
    if (n / (w * h) <= 0 || n >= w * h) throw new Error('claimed fraction should be in range');

    const big = new Uint8Array(GW * GH);
    stampBorder(big, GW, GH, BW);
    const startN = countClaimedBuf(big);
    if (startN / (GW * GH) >= GOAL) throw new Error('starting claimed should be well under 75%');
    if (GOAL !== 0.75) throw new Error('clear threshold is 75%');

    stampBorder(cells, GW, GH, BW);
    const px = GW >> 1;
    const py = GH - BW;
    if (cells[idx(px, py)] !== CLAIMED) throw new Error('player spawn must sit on claimed inner edge');
    if (!isEdge(px, py)) throw new Error('player spawn must be walkable edge');
    if (!isEmpty(px, py - 1)) throw new Error('inward step from spawn must enter empty (start a cut)');

    const cut = [];
    for (let i = 1; i <= 20; i++) cut.push({ x: px, y: py - i });
    for (let i = 1; i <= 16; i++) cut.push({ x: px + i, y: py - 20 });
    for (let i = 1; i <= 19; i++) cut.push({ x: px + 16, y: py - 20 + i });
    for (let i = 0; i < cut.length; i++) {
      if (cells[idx(cut[i].x, cut[i].y)] !== EMPTY) throw new Error('cut trail should travel empty cells');
    }
    const r4 = applyFill(cells, GW, GH, cut, [{ x: GW * 0.5, y: GH * 0.4 }]);
    if (r4.filled.length < 200) throw new Error('bottom bite should claim a chunk, got ' + r4.filled.length);
    if (cells[idx(px + 8, py - 8)] !== CLAIMED) throw new Error('bite interior should fill (qix is above)');
    if (cells[idx((GW * 0.5) | 0, (GH * 0.4) | 0)] !== EMPTY) throw new Error('qix pocket must remain empty');
    const after = countClaimedBuf(cells) / (GW * GH);
    if (after < 0.06 || after >= GOAL) throw new Error('one bite should raise claim but not clear 75%');
  }

  if (!hasDom) {
    selfCheck();
    return;
  }

  canvas.addEventListener('pointerdown', function (e) {
    if (e.button != null && e.button !== 0) return;
    audio.ensure();
    if (overlayOpen()) return;
    pointer.down = true;
    pointer.id = e.pointerId;
    const g = eventToGrid(e);
    pointer.x = g.x;
    pointer.y = g.y;
    canvas.classList.add('drag');
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    e.preventDefault();
  });
  canvas.addEventListener('pointermove', function (e) {
    const g = eventToGrid(e);
    pointer.x = g.x;
    pointer.y = g.y;
  });
  function endPtr(e) {
    if (pointer.id != null && e.pointerId !== pointer.id) return;
    pointer.down = false;
    pointer.id = null;
    canvas.classList.remove('drag');
  }
  canvas.addEventListener('pointerup', endPtr);
  canvas.addEventListener('pointercancel', endPtr);
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  window.addEventListener('keydown', function (e) {
    audio.ensure();
    onKey(e, true);
  });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('blur', function () {
    keys.n = keys.e = keys.s = keys.w = keys.shift = false;
    pointer.down = false;
    G.slowHold = false;
    syncSlowUi();
  });

  if (btnClassic) btnClassic.addEventListener('click', function () {
    audio.ensure();
    startGame('classic');
  });
  if (btnHelix) btnHelix.addEventListener('click', function () {
    audio.ensure();
    startGame('helix');
  });
  if (btnAgain) btnAgain.addEventListener('click', function () {
    restart();
  });
  if (btnMenu) btnMenu.addEventListener('click', function () {
    audio.ensure();
    bootTitle();
  });
  if (btnRetry) btnRetry.addEventListener('click', function () {
    restart();
  });
  if (btnMute) btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  if (btnSlow) {
    btnSlow.addEventListener('pointerdown', function (e) {
      G.slowHold = true;
      syncSlowUi();
      e.preventDefault();
    });
    btnSlow.addEventListener('pointerup', function () {
      G.slowHold = false;
      syncSlowUi();
    });
    btnSlow.addEventListener('pointerleave', function () {
      G.slowHold = false;
      syncSlowUi();
    });
    btnSlow.addEventListener('pointercancel', function () {
      G.slowHold = false;
      syncSlowUi();
    });
  }

  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (!hidden) {
      last = performance.now();
      acc = 0;
    }
  });

  function resize() {
    const rect = stageEl.getBoundingClientRect();
    dpr = Math.min(2.25, window.devicePixelRatio || 1);
    W = Math.max(1, Math.floor(rect.width * dpr));
    H = Math.max(1, Math.floor(rect.height * dpr));
    canvas.width = W;
    canvas.height = H;
    const fit = Math.min(W / VW, H / VH);
    scale = fit;
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
  }

  window.addEventListener('resize', resize);

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
  } catch (err) { /* ignore */ }

  loadBest();
  seedMotes();
  resize();
  bootTitle();
  syncHud();
  syncSlowUi();

  let last = performance.now();
  let acc = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (hidden) {
      last = now;
      return;
    }
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.05) dt = 0.05;
    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 5) {
      update(STEP);
      acc -= STEP;
      steps += 1;
    }
    if (acc > STEP * 5) acc = 0;
    draw();
  }
  requestAnimationFrame(frame);
})();
