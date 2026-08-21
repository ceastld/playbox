'use strict';

(function () {
  const GOAL = 6;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const MUTE_KEY = 'playbox-spot-diff-mute';
  const INNER = 0.82;

  const KIND_TEXT = {
    extra: '多星',
    missing: '缺星',
    hue: '换彩',
    shift: '微移',
    line: '断弦',
    size: '异芒'
  };

  const SKIES = [
    { name: '织女', sub: 'VEGA', kind: 'extra', n: 8, time: 18, teach: '一侧多了一颗星', hit: 0.15 },
    { name: '河鼓', sub: 'RIVER', kind: 'missing', n: 10, time: 16, teach: '一侧少了一颗星', hit: 0.14 },
    { name: '荧惑', sub: 'FLARE', kind: 'hue', n: 12, time: 14, teach: '', hit: 0.13 },
    { name: '天津', sub: 'FORD', kind: 'shift', n: 14, time: 13, teach: '', hit: 0.13, shift: 0.13 },
    { name: '奎宿', sub: 'LOOP', kind: 'line', n: 15, time: 12, teach: '', hit: 0.11 },
    { name: '北极', sub: 'POLE', kind: 'size', n: 17, time: 11, teach: '', hit: 0.12 }
  ];

  const canvas = document.getElementById('view');
  const ctx = canvas.getContext('2d', { alpha: false });
  const hud = document.getElementById('hud');
  const hintEl = document.getElementById('hint');
  const roundEl = document.getElementById('round');
  const timeEl = document.getElementById('time');
  const timeRead = timeEl.parentElement;
  const pipsEl = document.getElementById('pips');
  const pipNodes = pipsEl.querySelectorAll('i');
  const panel = document.getElementById('panel');
  const card = document.getElementById('card');
  const kickerEl = document.getElementById('panel-kicker');
  const titleEl = document.getElementById('panel-title');
  const leadEl = document.getElementById('panel-lead');
  const metaEl = document.getElementById('panel-meta');
  const footEl = document.getElementById('panel-foot');
  const btnMain = document.getElementById('btn-main');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnMark = document.getElementById('btn-mark');

  let W = 1;
  let H = 1;
  let dpr = 1;
  const L = {
    portrait: false,
    left: { x: 0, y: 0, r: 120 },
    right: { x: 0, y: 0, r: 120 }
  };

  const keys = { l: false, r: false, u: false, d: false };
  const ptr = {
    down: false,
    id: null,
    x: 0,
    y: 0,
    sx: 0,
    sy: 0,
    moved: 0
  };

  const farStars = [];
  const motes = [];
  const particles = [];
  const pops = [];
  const marks = [];

  const G = {
    mode: 'title',
    t: 0,
    clock: 0,
    round: 0,
    lives: LIVES,
    hits: 0,
    remain: 18,
    phase: 'seek',
    phaseT: 0,
    sky: null,
    aimX: 0,
    aimY: 0,
    shake: 0,
    flash: 0,
    flashC: 'cyan',
    paused: false,
    result: '',
    why: '',
    lock: 0,
    hintLock: 0,
    lastHint: '',
    warned: false,
    seed: 1,
    revealT: 0
  };

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function mix(a, b, t) {
    return a + (b - a) * t;
  }
  function easeOut(t) {
    t = clamp(t, 0, 1);
    return 1 - (1 - t) * (1 - t);
  }
  function smooth(t) {
    t = clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
  }
  function hypot2(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function rng(seed) {
    let s = seed % 2147483646;
    if (s <= 0) s += 2147483646;
    return function () {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }
  function pick(rand, a, b) {
    return a + rand() * (b - a);
  }
  function buzz(ms) {
    try {
      if (navigator.vibrate) navigator.vibrate(ms);
    } catch (e) {}
  }

  function currentSpec() {
    return SKIES[clamp(G.round, 0, SKIES.length - 1)];
  }

  function hueColor(hue, a) {
    const alpha = a == null ? 1 : a;
    if (hue === 'mag') return 'rgba(255,61,184,' + alpha + ')';
    if (hue === 'gold') return 'rgba(255,227,107,' + alpha + ')';
    return 'rgba(0,240,255,' + alpha + ')';
  }

  function hueHex(hue) {
    if (hue === 'mag') return '#ff3db8';
    if (hue === 'gold') return '#ffe36b';
    return '#00f0ff';
  }

  const audio = {
    ctx: null,
    master: null,
    drone: null,
    droneGain: null,
    muted: false,
    lastTick: -9,
    ensure: function () {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.22;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted: function (m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.22;
      btnMute.textContent = m ? '静音' : '声开';
      btnMute.classList.toggle('muted', m);
      btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      try {
        localStorage.setItem(MUTE_KEY, m ? '1' : '0');
      } catch (e) {}
    },
    beep: function (freq, dur, type, vol, slide) {
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
      o.stop(t + dur + 0.02);
    },
    pulse: function (kind) {
      this.ensure();
      if (kind === 'start') {
        this.beep(196, 0.14, 'sine', 0.07, 392);
        this.beep(294, 0.2, 'triangle', 0.05, 587);
      } else if (kind === 'mark') {
        this.beep(880, 0.05, 'sine', 0.035, 440);
      } else if (kind === 'hit') {
        this.beep(523, 0.12, 'sine', 0.08, 784);
        this.beep(659, 0.22, 'triangle', 0.06, 1046);
      } else if (kind === 'miss') {
        this.beep(164, 0.22, 'sawtooth', 0.07, 70);
        this.beep(98, 0.36, 'square', 0.04, 48);
      } else if (kind === 'win') {
        this.beep(523, 0.16, 'sine', 0.09, 659);
        this.beep(659, 0.24, 'triangle', 0.07, 784);
        this.beep(784, 0.4, 'sine', 0.06, 1175);
      } else if (kind === 'lose') {
        this.beep(174, 0.5, 'sawtooth', 0.08, 55);
        this.beep(82, 0.72, 'sine', 0.05, 40);
      } else if (kind === 'warn') {
        this.beep(880, 0.06, 'square', 0.03, 440);
      } else if (kind === 'tick') {
        this.beep(720, 0.04, 'sine', 0.022);
      } else if (kind === 'enter') {
        this.beep(330, 0.1, 'sine', 0.045, 495);
      }
    },
    tickDrone: function (seeking, remain) {
      if (!this.ctx || this.muted) return;
      if (!this.drone) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine';
        o.frequency.value = 46;
        g.gain.value = 0.012;
        o.connect(g);
        g.connect(this.master);
        o.start();
        this.drone = o;
        this.droneGain = g;
      }
      const t = this.ctx.currentTime;
      const low = seeking && remain < 4;
      this.drone.frequency.setTargetAtTime(low ? 38 : 48, t, 0.14);
      this.droneGain.gain.setTargetAtTime(
        seeking ? (low ? 0.036 : 0.014) : 0.006,
        t,
        0.14
      );
    },
    stopDrone: function () {
      if (!this.droneGain || !this.ctx) return;
      this.droneGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.25);
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
    else audio.setMuted(false);
  } catch (e) {
    audio.setMuted(false);
  }

  function spawnBackdrop() {
    farStars.length = 0;
    motes.length = 0;
    for (let i = 0; i < 90; i++) {
      farStars.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() < 0.15 ? 1.4 : 0.7 + Math.random() * 0.7,
        a: 0.22 + Math.random() * 0.55,
        p: Math.random() * TAU
      });
    }
    for (let i = 0; i < 18; i++) {
      motes.push({
        x: Math.random(),
        y: Math.random(),
        s: 0.6 + Math.random() * 1.2,
        p: Math.random() * TAU,
        col: Math.random() < 0.5 ? 'cyan' : 'mag'
      });
    }
  }

  function placeStars(rand, n, minDist) {
    const stars = [];
    let tries = 0;
    while (stars.length < n && tries < 2400) {
      tries += 1;
      const ang = rand() * TAU;
      const rad = Math.sqrt(rand()) * 0.76;
      const x = Math.cos(ang) * rad;
      const y = Math.sin(ang) * rad;
      let ok = true;
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const dx = s.x - x;
        const dy = s.y - y;
        if (dx * dx + dy * dy < minDist * minDist) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
      const roll = rand();
      const hue = roll < 0.52 ? 'cyan' : roll < 0.88 ? 'mag' : 'gold';
      stars.push({
        id: stars.length,
        x: x,
        y: y,
        r: 1.55 + rand() * 2.35,
        hue: hue,
        tw: rand() * TAU,
        spark: rand() < 0.38
      });
    }
    return stars;
  }

  function mstEdges(stars) {
    const n = stars.length;
    if (n < 2) return [];
    const used = new Uint8Array(n);
    used[0] = 1;
    const edges = [];
    for (let k = 0; k < n - 1; k++) {
      let best = 1e9;
      let a = -1;
      let b = -1;
      for (let i = 0; i < n; i++) {
        if (!used[i]) continue;
        for (let j = 0; j < n; j++) {
          if (used[j]) continue;
          const dx = stars[i].x - stars[j].x;
          const dy = stars[i].y - stars[j].y;
          const d = dx * dx + dy * dy;
          if (d < best) {
            best = d;
            a = i;
            b = j;
          }
        }
      }
      if (b < 0) break;
      used[b] = 1;
      edges.push([stars[a].id, stars[b].id]);
    }
    return edges;
  }

  function addChordEdges(stars, edges, rand, extra) {
    const n = stars.length;
    let added = 0;
    let guard = 0;
    while (added < extra && guard < 80) {
      guard += 1;
      const i = (Math.floor(rand() * n) + guard) % n;
      let bestJ = -1;
      let bestD = 1e9;
      for (let j = 0; j < n; j++) {
        if (j === i) continue;
        if (hasEdge(edges, stars[i].id, stars[j].id)) continue;
        const d = hypot2(stars[i].x - stars[j].x, stars[i].y - stars[j].y);
        if (d > 0.18 && d < 0.42 && d < bestD) {
          bestD = d;
          bestJ = j;
        }
      }
      if (bestJ >= 0) {
        edges.push([stars[i].id, stars[bestJ].id]);
        added += 1;
      }
    }
    return edges;
  }

  function hasEdge(edges, a, b) {
    for (let i = 0; i < edges.length; i++) {
      const e = edges[i];
      if ((e[0] === a && e[1] === b) || (e[0] === b && e[1] === a)) return true;
    }
    return false;
  }

  function cloneStars(stars) {
    const out = [];
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      out.push({
        id: s.id,
        x: s.x,
        y: s.y,
        r: s.r,
        hue: s.hue,
        tw: s.tw,
        spark: s.spark
      });
    }
    return out;
  }

  function cloneEdges(edges) {
    const out = [];
    for (let i = 0; i < edges.length; i++) out.push([edges[i][0], edges[i][1]]);
    return out;
  }

  function starById(stars, id) {
    for (let i = 0; i < stars.length; i++) if (stars[i].id === id) return stars[i];
    return null;
  }

  function degreeOf(edges, id) {
    let d = 0;
    for (let i = 0; i < edges.length; i++) {
      if (edges[i][0] === id || edges[i][1] === id) d += 1;
    }
    return d;
  }

  function distToSeg(px, py, ax, ay, bx, by) {
    const vx = bx - ax;
    const vy = by - ay;
    const l2 = vx * vx + vy * vy;
    let t = l2 > 1e-8 ? ((px - ax) * vx + (py - ay) * vy) / l2 : 0;
    t = clamp(t, 0.22, 0.78);
    return hypot2(px - (ax + t * vx), py - (ay + t * vy));
  }

  function buildSky(spec, seed) {
    const rand = rng(seed);
    const minDist = spec.n > 14 ? 0.135 : spec.n > 10 ? 0.155 : 0.185;
    let stars = placeStars(rand, spec.n, minDist);
    if (stars.length < Math.max(5, spec.n - 2)) {
      stars = placeStars(rand, spec.n, minDist * 0.82);
    }
    const edges = addChordEdges(
      stars,
      mstEdges(stars),
      rand,
      spec.n >= 12 ? 3 : spec.n >= 9 ? 2 : 1
    );
    const nebula = [];
    const nNeb = 3 + ((rand() * 2) | 0);
    for (let i = 0; i < nNeb; i++) {
      nebula.push({
        x: pick(rand, -0.45, 0.45),
        y: pick(rand, -0.45, 0.45),
        r: pick(rand, 0.28, 0.52),
        col: rand() < 0.5 ? 'cyan' : 'mag',
        a: pick(rand, 0.1, 0.2)
      });
    }
    const specks = [];
    for (let i = 0; i < 36; i++) {
      const ang = rand() * TAU;
      const rad = Math.sqrt(rand()) * 0.78;
      specks.push({
        x: Math.cos(ang) * rad,
        y: Math.sin(ang) * rad,
        a: 0.12 + rand() * 0.22,
        r: 0.5 + rand() * 0.7
      });
    }

    const leftS = cloneStars(stars);
    const rightS = cloneStars(stars);
    const leftE = cloneEdges(edges);
    const rightE = cloneEdges(edges);
    const side = rand() < 0.5 ? 0 : 1;
    const mutS = side === 0 ? leftS : rightS;
    const mutE = side === 0 ? leftE : rightE;

    const target = {
      kind: spec.kind,
      x: 0,
      y: 0,
      x2: null,
      y2: null,
      r: spec.hit,
      line: null,
      label: KIND_TEXT[spec.kind]
    };

    if (spec.kind === 'extra') {
      let x = 0;
      let y = 0;
      let ok = false;
      for (let t = 0; t < 40; t++) {
        const ang = rand() * TAU;
        const rad = pick(rand, 0.22, 0.62);
        x = Math.cos(ang) * rad;
        y = Math.sin(ang) * rad;
        ok = true;
        for (let i = 0; i < stars.length; i++) {
          if (hypot2(stars[i].x - x, stars[i].y - y) < 0.18) {
            ok = false;
            break;
          }
        }
        if (ok) break;
      }
      const ns = {
        id: 900 + side,
        x: x,
        y: y,
        r: 3.4 + rand() * 0.8,
        hue: 'gold',
        tw: rand() * TAU,
        spark: true
      };
      mutS.push(ns);
      target.x = x;
      target.y = y;
      target.label = '多星';
    } else if (spec.kind === 'missing') {
      let pickId = stars[0].id;
      let bestScore = -1;
      for (let i = 0; i < stars.length; i++) {
        const id = stars[i].id;
        if (degreeOf(edges, id) !== 1) continue;
        const score = stars[i].r + (hypot2(stars[i].x, stars[i].y) < 0.62 ? 0.5 : 0);
        if (score > bestScore) {
          bestScore = score;
          pickId = id;
        }
      }
      if (bestScore < 0) {
        let bestR = -1;
        for (let i = 0; i < stars.length; i++) {
          if (stars[i].r > bestR) {
            bestR = stars[i].r;
            pickId = stars[i].id;
          }
        }
      }
      const gone = starById(stars, pickId);
      target.x = gone.x;
      target.y = gone.y;
      for (let i = mutS.length - 1; i >= 0; i--) {
        if (mutS[i].id === pickId) mutS.splice(i, 1);
      }
      for (let i = mutE.length - 1; i >= 0; i--) {
        if (mutE[i][0] === pickId || mutE[i][1] === pickId) mutE.splice(i, 1);
      }
      target.label = '缺星';
    } else if (spec.kind === 'hue') {
      const ranked = stars.slice().sort(function (a, b) {
        return b.r - a.r;
      });
      const s = ranked[1 + ((rand() * Math.min(4, ranked.length - 1)) | 0)] || ranked[0];
      const mut = starById(mutS, s.id);
      mut.hue = s.hue === 'mag' ? 'cyan' : 'mag';
      mut.spark = true;
      target.x = s.x;
      target.y = s.y;
      target.label = '换彩';
    } else if (spec.kind === 'shift') {
      const ranked = stars.slice().sort(function (a, b) {
        return b.r - a.r;
      });
      const s = ranked[1 + ((rand() * Math.min(5, ranked.length - 1)) | 0)] || ranked[0];
      const mut = starById(mutS, s.id);
      const ang = rand() * TAU;
      const dist = spec.shift || 0.13;
      let nx = s.x + Math.cos(ang) * dist;
      let ny = s.y + Math.sin(ang) * dist;
      const mag = hypot2(nx, ny);
      if (mag > 0.76) {
        nx *= 0.76 / mag;
        ny *= 0.76 / mag;
      }
      mut.x = nx;
      mut.y = ny;
      target.x = nx;
      target.y = ny;
      target.x2 = s.x;
      target.y2 = s.y;
      target.label = '微移';
    } else if (spec.kind === 'line') {
      const add = rand() < 0.55;
      if (add) {
        let best = null;
        let bestScore = 1e9;
        for (let i = 0; i < stars.length; i++) {
          for (let j = i + 1; j < stars.length; j++) {
            if (hasEdge(edges, stars[i].id, stars[j].id)) continue;
            const d = hypot2(stars[i].x - stars[j].x, stars[i].y - stars[j].y);
            if (d < 0.26 || d > 0.46) continue;
            const score = Math.abs(d - 0.34);
            if (score < bestScore) {
              bestScore = score;
              best = [stars[i], stars[j]];
            }
          }
        }
        if (!best) {
          best = [stars[0], stars[Math.min(2, stars.length - 1)]];
        }
        mutE.push([best[0].id, best[1].id]);
        target.x = (best[0].x + best[1].x) * 0.5;
        target.y = (best[0].y + best[1].y) * 0.5;
        target.line = {
          ax: best[0].x,
          ay: best[0].y,
          bx: best[1].x,
          by: best[1].y
        };
        target.label = '添线';
      } else {
        let pickE = edges[edges.length - 1];
        let bestLen = -1;
        for (let i = 0; i < edges.length; i++) {
          const a = starById(stars, edges[i][0]);
          const b = starById(stars, edges[i][1]);
          if (!a || !b) continue;
          const d = hypot2(a.x - b.x, a.y - b.y);
          if (d > 0.2 && d < 0.5 && d > bestLen) {
            if (degreeOf(edges, a.id) > 1 && degreeOf(edges, b.id) > 1) {
              bestLen = d;
              pickE = edges[i];
            }
          }
        }
        const a = starById(stars, pickE[0]);
        const b = starById(stars, pickE[1]);
        for (let i = mutE.length - 1; i >= 0; i--) {
          if (
            (mutE[i][0] === pickE[0] && mutE[i][1] === pickE[1]) ||
            (mutE[i][0] === pickE[1] && mutE[i][1] === pickE[0])
          ) {
            mutE.splice(i, 1);
          }
        }
        target.x = (a.x + b.x) * 0.5;
        target.y = (a.y + b.y) * 0.5;
        target.line = { ax: a.x, ay: a.y, bx: b.x, by: b.y };
        target.label = '断线';
      }
    } else if (spec.kind === 'size') {
      const ranked = stars.slice().sort(function (a, b) {
        return b.r - a.r;
      });
      const mid = ranked[2 + ((rand() * Math.min(5, ranked.length - 2)) | 0)] || ranked[0];
      const mut = starById(mutS, mid.id);
      const grow = rand() < 0.6;
      mut.r = grow ? mid.r * 2.15 : Math.max(1.1, mid.r * 0.42);
      mut.spark = grow;
      target.x = mid.x;
      target.y = mid.y;
      target.label = '异芒';
    }

    return {
      name: spec.name,
      sub: spec.sub,
      kind: spec.kind,
      teach: spec.teach,
      time: spec.time,
      leftS: leftS,
      rightS: rightS,
      leftE: leftE,
      rightE: rightE,
      nebula: nebula,
      specks: specks,
      target: target,
      side: side,
      catalog: 410 + ((seed / 17) | 0) % 80
    };
  }

  function emit(n, opt) {
    for (let i = 0; i < n; i++) {
      particles.push({
        x: opt.x + pick(Math.random, -opt.j, opt.j),
        y: opt.y + pick(Math.random, -opt.j, opt.j),
        vx: pick(Math.random, opt.vx0, opt.vx1),
        vy: pick(Math.random, opt.vy0, opt.vy1),
        life: pick(Math.random, opt.life * 0.6, opt.life),
        max: opt.life,
        r: pick(Math.random, opt.r0, opt.r1),
        col: opt.col,
        g: opt.g || 40
      });
    }
  }

  function popup(x, y, text, col) {
    pops.push({ x: x, y: y, text: text, col: col, life: 0.9, max: 0.9 });
  }

  function setHint(text, cls) {
    if (G.hintLock > 0 && cls !== 'warn' && cls !== 'gold' && cls !== 'hot') return;
    hintEl.textContent = text;
    hintEl.className = 'hint' + (cls ? ' ' + cls : '');
    G.lastHint = text;
    if (cls === 'warn' || cls === 'gold' || cls === 'hot') G.hintLock = 1.1;
  }

  function setLivesPips() {
    for (let i = 0; i < pipNodes.length; i++) {
      pipNodes[i].className = '';
      if (i < G.lives) {
        pipNodes[i].classList.add(G.lives === 1 ? 'warn' : 'on');
      }
    }
  }

  function refreshHud() {
    const spec = currentSpec();
    roundEl.textContent = G.mode === 'play' ? G.round + 1 + '/' + GOAL : '—';
    const ts = G.mode === 'play' ? G.remain.toFixed(1) : '—';
    if (timeEl.textContent !== ts) timeEl.textContent = ts;
    timeRead.classList.toggle('warn', G.mode === 'play' && G.remain < 4);
    timeRead.classList.toggle('hot', G.mode === 'play' && G.remain >= 4);
    setLivesPips();
  }

  function showPanel(kind) {
    panel.classList.remove('hidden');
    hud.classList.add('hidden');
    card.classList.remove('win', 'lose');
    if (kind === 'title') {
      kickerEl.textContent = 'SPOT';
      titleEl.textContent = '寻隙';
      leadEl.textContent = '两幅星图有一处不同，快指出来。';
      metaEl.textContent = '六幅星图。准星左右同步，对照后点在那一处隙上。标错三次或时尽即负。';
      btnMain.textContent = '开寻';
      footEl.textContent = 'WASD / 方向键移准星 · 空格或点按标记 · 拖动对照 · M 静音';
    } else if (kind === 'win') {
      card.classList.add('win');
      kickerEl.textContent = 'CLEAR';
      titleEl.textContent = '寻得';
      leadEl.textContent = '六处隙都被你指了出来。';
      metaEl.textContent = '用时 ' + G.clock.toFixed(1) + ' 秒 · 余命 ' + G.lives;
      btnMain.textContent = '再寻一轮';
      footEl.textContent = '回车再来 · R 重开 · M 静音';
    } else {
      card.classList.add('lose');
      kickerEl.textContent = 'LOST';
      titleEl.textContent = G.why === '时尽' ? '时尽' : '失隙';
      leadEl.textContent = G.why === '时尽' ? '灯灭之前没有指出那一处。' : '三次都指偏了。';
      const spec = currentSpec();
      metaEl.textContent =
        '停在「' +
        spec.name +
        '」· ' +
        (G.hits ? '已寻 ' + G.hits + ' 幅' : '第一幅未中') +
        ' · 那一处是' +
        (G.sky && G.sky.target ? G.sky.target.label : KIND_TEXT[spec.kind]);
      btnMain.textContent = '再试一次';
      footEl.textContent = '回车再来 · R 重开 · M 静音';
    }
  }

  function hidePanel() {
    panel.classList.add('hidden');
    hud.classList.remove('hidden');
  }

  function toScreen(plate, nx, ny) {
    return [plate.x + nx * plate.r * INNER, plate.y + ny * plate.r * INNER];
  }

  function fromScreen(plate, sx, sy) {
    const k = plate.r * INNER;
    return [(sx - plate.x) / k, (sy - plate.y) / k];
  }

  function plateAt(sx, sy) {
    const dl = hypot2(sx - L.left.x, sy - L.left.y);
    if (dl <= L.left.r + 6) return L.left;
    const dr = hypot2(sx - L.right.x, sy - L.right.y);
    if (dr <= L.right.r + 6) return L.right;
    return null;
  }

  function clampAim() {
    const m = hypot2(G.aimX, G.aimY);
    if (m > 0.84) {
      G.aimX *= 0.84 / m;
      G.aimY *= 0.84 / m;
    }
  }

  function hitTest(nx, ny) {
    const t = G.sky && G.sky.target;
    if (!t) return false;
    if (t.line) {
      return distToSeg(nx, ny, t.line.ax, t.line.ay, t.line.bx, t.line.by) <= t.r * 0.85;
    }
    if (hypot2(nx - t.x, ny - t.y) <= t.r) return true;
    if (t.x2 != null && hypot2(nx - t.x2, ny - t.y2) <= t.r) return true;
    return false;
  }

  function beginRound() {
    const spec = currentSpec();
    G.seed = ((G.seed * 1103515245 + 12345) >>> 0) || 1;
    G.sky = buildSky(spec, G.seed + G.round * 97 + (Date.now() & 1023));
    G.phase = 'enter';
    G.phaseT = 0;
    G.remain = spec.time;
    G.aimX = 0;
    G.aimY = 0;
    G.warned = false;
    G.lock = 0.15;
    G.hintLock = 0;
    marks.length = 0;
    audio.pulse('enter');
    const teach = spec.teach ? spec.teach + ' · 点它' : '左右对照，点出那一处不同';
    setHint(teach, spec.teach ? 'hot' : '');
    refreshHud();
  }

  function startRun() {
    G.mode = 'play';
    G.round = 0;
    G.lives = LIVES;
    G.hits = 0;
    G.clock = 0;
    G.result = '';
    G.why = '';
    G.shake = 0;
    G.flash = 0;
    G.paused = false;
    G.seed = (Math.random() * 1e9) | 0;
    hidePanel();
    btnMain.blur();
    audio.ensure();
    audio.pulse('start');
    beginRound();
  }

  function endRun(win, why) {
    G.mode = 'end';
    G.result = win ? 'win' : 'lose';
    G.why = why || (win ? '' : '找错');
    G.phase = 'seek';
    audio.stopDrone();
    audio.pulse(win ? 'win' : 'lose');
    if (!win && G.sky && G.sky.target) {
      const t = G.sky.target;
      const pL = toScreen(L.left, t.x, t.y);
      const pR = toScreen(L.right, t.x, t.y);
      popup(pL[0], pL[1] - 16, t.label, '#ffe36b');
      popup(pR[0], pR[1] - 16, t.label, '#ffe36b');
    }
    showPanel(win ? 'win' : 'lose');
    refreshHud();
    buzz(win ? 18 : [24, 40, 24]);
  }

  function burstAtNorm(nx, ny, col, n) {
    const a = toScreen(L.left, nx, ny);
    const b = toScreen(L.right, nx, ny);
    emit(n, {
      x: a[0],
      y: a[1],
      j: 10,
      vx0: -90,
      vx1: 90,
      vy0: -120,
      vy1: 40,
      life: 0.55,
      r0: 1.2,
      r1: 3.2,
      col: col,
      g: 70
    });
    emit(n, {
      x: b[0],
      y: b[1],
      j: 10,
      vx0: -90,
      vx1: 90,
      vy0: -120,
      vy1: 40,
      life: 0.55,
      r0: 1.2,
      r1: 3.2,
      col: col,
      g: 70
    });
  }

  function markNow() {
    if (G.mode !== 'play' || G.paused) return;
    if (G.phase !== 'seek') return;
    if (G.lock > 0) return;
    audio.pulse('mark');
    G.lock = 0.28;
    const ok = hitTest(G.aimX, G.aimY);
    marks.push({ x: G.aimX, y: G.aimY, ok: ok, t: 0 });
    if (ok) {
      G.phase = 'reveal';
      G.phaseT = 0;
      G.hits += 1;
      G.flash = 0.45;
      G.flashC = 'gold';
      G.shake = 0.25;
      audio.pulse('hit');
      const t = G.sky.target;
      burstAtNorm(t.x, t.y, '#ffe36b', 16);
      burstAtNorm(t.x, t.y, '#00f0ff', 8);
      const mid = L.portrait
        ? [(L.left.x + L.right.x) * 0.5, (L.left.y + L.right.y) * 0.5]
        : [(L.left.x + L.right.x) * 0.5, L.left.y];
      popup(mid[0], mid[1] - (L.portrait ? 0 : L.left.r * 0.15), t.label, '#ffe36b');
      setHint('找见了 · ' + t.label, 'gold');
      buzz(16);
      refreshHud();
    } else {
      G.lives -= 1;
      G.flash = 0.4;
      G.flashC = 'pink';
      G.shake = 0.7;
      audio.pulse('miss');
      burstAtNorm(G.aimX, G.aimY, '#ff3db8', 10);
      popup(
        mix(L.left.x, L.right.x, 0.5),
        mix(L.left.y, L.right.y, 0.5) - 10,
        '偏了',
        '#ff3db8'
      );
      setHint(G.lives > 0 ? '偏了 · 还剩 ' + G.lives + ' 命' : '三次都偏了', 'warn');
      buzz([16, 28, 16]);
      setLivesPips();
      if (G.lives <= 0) {
        endRun(false, '找错');
      }
    }
  }

  function resolveReveal() {
    if (G.hits >= GOAL) {
      endRun(true);
      return;
    }
    G.round += 1;
    beginRound();
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = pops.length - 1; i >= 0; i--) {
      const p = pops[i];
      p.life -= dt;
      if (p.life <= 0) pops.splice(i, 1);
    }
    for (let i = marks.length - 1; i >= 0; i--) {
      marks[i].t += dt;
    }
  }

  function titleSky() {
    if (G.sky && G.sky.demo) return;
    G.sky = buildSky(SKIES[0], 4242);
    G.sky.demo = true;
  }

  function update(dt) {
    G.t += dt;
    if (G.lock > 0) G.lock -= dt;
    if (G.hintLock > 0) G.hintLock -= dt;
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 2.6);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 1.7);
    updateParticles(dt);

    if (G.mode === 'title') {
      titleSky();
      G.aimX = Math.cos(G.t * 0.35) * 0.42;
      G.aimY = Math.sin(G.t * 0.28) * 0.34;
      audio.tickDrone(false, 9);
      return;
    }

    if (G.mode === 'end') {
      audio.tickDrone(false, 9);
      return;
    }

    if (G.paused) {
      audio.tickDrone(false, G.remain);
      return;
    }

    G.clock += dt;

    if (G.phase === 'enter') {
      G.phaseT += dt;
      if (G.phaseT >= 0.46) {
        G.phase = 'seek';
        G.phaseT = 0;
      }
    } else if (G.phase === 'reveal') {
      G.phaseT += dt;
      if (G.phaseT >= 1.05) resolveReveal();
    } else if (G.phase === 'seek') {
      const spd = 0.92;
      if (keys.l) G.aimX -= spd * dt;
      if (keys.r) G.aimX += spd * dt;
      if (keys.u) G.aimY -= spd * dt;
      if (keys.d) G.aimY += spd * dt;
      clampAim();

      G.remain -= dt;
      if (G.remain < 4 && !G.warned) {
        G.warned = true;
        audio.pulse('warn');
        setHint('时将尽', 'warn');
      }
      if (G.remain < 3.2) {
        const tickAt = Math.floor(G.remain);
        if (tickAt !== audio.lastTick && G.remain > 0) {
          audio.lastTick = tickAt;
          audio.pulse('tick');
        }
      }
      if (G.remain <= 0) {
        G.remain = 0;
        endRun(false, '时尽');
        return;
      }
      refreshHud();
    }

    audio.tickDrone(G.phase === 'seek', G.remain);
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

  function drawStar(x, y, star, boost) {
    const tw = 0.82 + 0.18 * Math.sin(G.t * 2.2 + star.tw);
    const r = star.r * (0.92 + 0.08 * tw) * (boost || 1);
    const col = hueHex(star.hue);
    ctx.save();
    ctx.shadowColor = col;
    ctx.shadowBlur = r * 4.4;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
    if (star.spark || r > 2.4) {
      ctx.globalAlpha = 0.75 * tw;
      ctx.strokeStyle = col;
      ctx.lineWidth = 1;
      const arm = r * 2.6;
      ctx.beginPath();
      ctx.moveTo(x, y - arm);
      ctx.lineTo(x, y + arm);
      ctx.moveTo(x - arm, y);
      ctx.lineTo(x + arm, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawEdges(plate, stars, edges, alpha) {
    ctx.save();
    ctx.strokeStyle = 'rgba(0,240,255,' + alpha + ')';
    ctx.lineWidth = 1.15;
    for (let i = 0; i < edges.length; i++) {
      const a = starById(stars, edges[i][0]);
      const b = starById(stars, edges[i][1]);
      if (!a || !b) continue;
      const pa = toScreen(plate, a.x, a.y);
      const pb = toScreen(plate, b.x, b.y);
      ctx.beginPath();
      ctx.moveTo(pa[0], pa[1]);
      ctx.lineTo(pb[0], pb[1]);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPlate(plate, stars, edges, tint, label, sub) {
    const x = plate.x;
    const y = plate.y;
    const r = plate.r;
    const sweep = (G.t * 0.42) % TAU;
    const enter =
      G.mode === 'play' && G.phase === 'enter' ? easeOut(G.phaseT / 0.46) : 1;
    const scale = mix(0.86, 1, enter);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.translate(-x, -y);
    ctx.globalAlpha = mix(0.15, 1, enter);

    ctx.save();
    ctx.shadowColor = tint === 'mag' ? 'rgba(255,61,184,0.35)' : 'rgba(0,240,255,0.35)';
    ctx.shadowBlur = 22;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fillStyle = '#070510';
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fillStyle = '#090613';
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r - 1, 0, TAU);
    ctx.clip();

    if (G.sky) {
      for (let i = 0; i < G.sky.nebula.length; i++) {
        const n = G.sky.nebula[i];
        const p = toScreen(plate, n.x, n.y);
        const g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], n.r * r);
        const c = n.col === 'mag' ? '255,61,184' : '0,240,255';
        g.addColorStop(0, 'rgba(' + c + ',' + n.a + ')');
        g.addColorStop(1, 'rgba(' + c + ',0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
      for (let i = 0; i < G.sky.specks.length; i++) {
        const s = G.sky.specks[i];
        const p = toScreen(plate, s.x, s.y);
        ctx.fillStyle = 'rgba(246,243,255,' + s.a + ')';
        ctx.beginPath();
        ctx.arc(p[0], p[1], s.r, 0, TAU);
        ctx.fill();
      }
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.38, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, r * 0.64, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - r * 0.9, y);
    ctx.lineTo(x + r * 0.9, y);
    ctx.moveTo(x, y - r * 0.9);
    ctx.lineTo(x, y + r * 0.9);
    ctx.stroke();

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(sweep);
    const sg = ctx.createLinearGradient(0, 0, r, 0);
    sg.addColorStop(0, 'rgba(0,240,255,0.16)');
    sg.addColorStop(1, 'rgba(0,240,255,0)');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r - 2, -0.18, 0.02);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    drawEdges(plate, stars, edges, 0.42);

    const sweepX = Math.cos(sweep);
    const sweepY = Math.sin(sweep);
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const p = toScreen(plate, s.x, s.y);
      const ang = Math.atan2(s.y, s.x);
      let dAng = Math.abs(ang - sweep);
      if (dAng > Math.PI) dAng = TAU - dAng;
      const boost = dAng < 0.18 ? 1 + (0.18 - dAng) * 1.6 : 1;
      drawStar(p[0], p[1], s, boost);
    }

    ctx.restore();

    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.strokeStyle = tint === 'mag' ? 'rgba(255,61,184,0.75)' : 'rgba(0,240,255,0.75)';
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, r + 7, 0, TAU);
    ctx.strokeStyle = tint === 'mag' ? 'rgba(255,61,184,0.28)' : 'rgba(0,240,255,0.28)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.strokeStyle = tint === 'mag' ? 'rgba(255,61,184,0.4)' : 'rgba(0,240,255,0.4)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * TAU;
      const long = i % 6 === 0;
      const i0 = r + (long ? 1 : 3);
      const i1 = r + 7;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * i0, y + Math.sin(a) * i0);
      ctx.lineTo(x + Math.cos(a) * i1, y + Math.sin(a) * i1);
      ctx.stroke();
    }

    ctx.fillStyle = tint === 'mag' ? 'rgba(255,61,184,0.85)' : 'rgba(0,240,255,0.85)';
    ctx.font = '700 11px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, y + r + 20);
    ctx.fillStyle = 'rgba(154,160,200,0.7)';
    ctx.font = '10px "Segoe UI", "PingFang SC", sans-serif';
    ctx.fillText(sub, x, y + r + 34);

    ctx.restore();
  }

  function drawReticle(plate) {
    const p = toScreen(plate, G.aimX, G.aimY);
    const pulse = 0.55 + 0.45 * Math.sin(G.t * 6.2);
    ctx.save();
    ctx.strokeStyle = 'rgba(255,227,107,' + (0.7 + 0.25 * pulse) + ')';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(p[0], p[1], 11 + pulse * 2, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(p[0] - 16, p[1]);
    ctx.lineTo(p[0] - 5, p[1]);
    ctx.moveTo(p[0] + 5, p[1]);
    ctx.lineTo(p[0] + 16, p[1]);
    ctx.moveTo(p[0], p[1] - 16);
    ctx.lineTo(p[0], p[1] - 5);
    ctx.moveTo(p[0], p[1] + 5);
    ctx.lineTo(p[0], p[1] + 16);
    ctx.stroke();
    ctx.fillStyle = '#ffe36b';
    ctx.beginPath();
    ctx.arc(p[0], p[1], 1.6, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawMarks(plate) {
    for (let i = 0; i < marks.length; i++) {
      const m = marks[i];
      const p = toScreen(plate, m.x, m.y);
      const a = clamp(1 - m.t / 3.2, 0.25, 1);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.strokeStyle = m.ok ? '#ffe36b' : '#ff3db8';
      ctx.lineWidth = 2;
      if (m.ok) {
        ctx.beginPath();
        ctx.arc(p[0], p[1], 14, 0, TAU);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(p[0] - 8, p[1] - 8);
        ctx.lineTo(p[0] + 8, p[1] + 8);
        ctx.moveTo(p[0] + 8, p[1] - 8);
        ctx.lineTo(p[0] - 8, p[1] + 8);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawReveal() {
    if (!G.sky || G.mode === 'title') return;
    const show =
      G.mode === 'end' ||
      (G.mode === 'play' && G.phase === 'reveal');
    if (!show) return;
    const t = G.sky.target;
    const u = G.mode === 'play' ? easeOut(clamp(G.phaseT / 0.45, 0, 1)) : 1;
    const plates = [L.left, L.right];
    for (let i = 0; i < 2; i++) {
      const p = toScreen(plates[i], t.x, t.y);
      ctx.save();
      ctx.globalAlpha = 0.35 + 0.65 * u;
      ctx.strokeStyle = '#ffe36b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p[0], p[1], 18 + (1 - u) * 22, 0, TAU);
      ctx.stroke();
      if (t.line) {
        const a = toScreen(plates[i], t.line.ax, t.line.ay);
        const b = toScreen(plates[i], t.line.bx, t.line.by);
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
    }
  }

  function drawBridge() {
    const a = toScreen(L.left, G.aimX, G.aimY);
    const b = toScreen(L.right, G.aimX, G.aimY);
    ctx.save();
    ctx.strokeStyle = 'rgba(255,227,107,0.18)';
    ctx.setLineDash([4, 6]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    const mx = (L.left.x + L.right.x) * 0.5;
    const my = (L.left.y + L.right.y) * 0.5;
    ctx.save();
    ctx.fillStyle = '#ffe36b';
    ctx.shadowColor = '#ffe36b';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(mx, my - 7);
    ctx.lineTo(mx + 7, my);
    ctx.lineTo(mx, my + 7);
    ctx.lineTo(mx - 7, my);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#05030c';
    ctx.font = '700 9px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('隙', mx, my + 0.5);
    ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }

  function drawTimerRing() {
    if (G.mode !== 'play' || !G.sky || L.portrait) return;
    const spec = currentSpec();
    const frac = clamp(G.remain / spec.time, 0, 1);
    const y = L.left.y - L.left.r - 42;
    const w = Math.min(240, Math.abs(L.right.x - L.left.x) + L.left.r * 0.2);
    const x = (L.left.x + L.right.x) * 0.5 - w / 2;
    const yy = Math.max(72, y);
    roundRect(x, yy, w, 6, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fill();
    roundRect(x, yy, w * frac, 6, 3);
    ctx.fillStyle = frac < 0.28 ? '#ff3db8' : frac < 0.5 ? '#ffe36b' : '#00f0ff';
    ctx.fill();
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#05030c';
    ctx.fillRect(0, 0, W, H);

    const bg = ctx.createRadialGradient(W * 0.18, H * -0.04, 20, W * 0.5, H * 0.5, Math.max(W, H) * 0.78);
    bg.addColorStop(0, 'rgba(255,61,184,0.14)');
    bg.addColorStop(0.5, 'rgba(5,3,12,0)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    const bg2 = ctx.createRadialGradient(W * 0.92, H * 0.06, 8, W * 0.82, H * 0.18, W * 0.55);
    bg2.addColorStop(0, 'rgba(0,240,255,0.11)');
    bg2.addColorStop(1, 'rgba(5,3,12,0)');
    ctx.fillStyle = bg2;
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < farStars.length; i++) {
      const s = farStars[i];
      const a = s.a * (0.62 + 0.38 * Math.sin(G.t * 1.3 + s.p));
      ctx.fillStyle = 'rgba(246,243,255,' + a + ')';
      ctx.beginPath();
      ctx.arc(s.x * W, s.y * H, s.r, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const mx = (m.x + Math.sin(G.t * 0.1 * m.s + m.p) * 0.04) * W;
      const my = ((m.y + G.t * 0.012 * m.s) % 1) * H;
      ctx.fillStyle = m.col === 'cyan' ? 'rgba(0,240,255,0.14)' : 'rgba(255,61,184,0.12)';
      ctx.beginPath();
      ctx.arc(mx, my, 1.5 * m.s, 0, TAU);
      ctx.fill();
    }

    if (!G.sky) return;

    const sx = G.shake ? (Math.random() * 2 - 1) * 5 * G.shake : 0;
    const sy = G.shake ? (Math.random() * 2 - 1) * 4 * G.shake : 0;
    ctx.save();
    ctx.translate(sx, sy);

    const cat = 'No.' + G.sky.catalog;
    drawPlate(L.left, G.sky.leftS, G.sky.leftE, 'mag', '左图', cat);
    drawPlate(L.right, G.sky.rightS, G.sky.rightE, 'cyan', '右图', G.sky.name + ' · ' + G.sky.sub);
    drawBridge();
    drawMarks(L.left);
    drawMarks(L.right);
    if (G.mode !== 'end') {
      drawReticle(L.left);
      drawReticle(L.right);
    }
    drawReveal();
    drawTimerRing();

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = p.col;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    for (let i = 0; i < pops.length; i++) {
      const p = pops[i];
      const u = 1 - p.life / p.max;
      ctx.globalAlpha = 1 - u;
      ctx.fillStyle = p.col;
      ctx.font = '900 26px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.text, p.x, p.y - u * 28);
      ctx.globalAlpha = 1;
    }

    ctx.restore();

    if (G.paused && G.mode === 'play') {
      ctx.fillStyle = 'rgba(5,3,12,0.45)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f6f3ff';
      ctx.font = '700 18px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('暂停', W * 0.5, H * 0.5);
    }

    if (G.flash > 0) {
      ctx.fillStyle =
        G.flashC === 'gold'
          ? 'rgba(255,227,107,' + G.flash * 0.16 + ')'
          : G.flashC === 'pink'
            ? 'rgba(255,61,184,' + G.flash * 0.16 + ')'
            : 'rgba(0,240,255,' + G.flash * 0.12 + ')';
      ctx.fillRect(0, 0, W, H);
    }
  }

  function layout() {
    const top = 78;
    const bot = 62;
    const availH = Math.max(160, H - top - bot);
    const availW = Math.max(160, W - 24);
    L.portrait = availW < availH * 1.12;
    if (!L.portrait) {
      const r = Math.min(availH * 0.38, availW * 0.21, 200);
      const gap = Math.min(64, Math.max(32, availW * 0.06));
      L.left.r = L.right.r = r;
      L.left.x = W * 0.5 - r - gap * 0.5;
      L.right.x = W * 0.5 + r + gap * 0.5;
      L.left.y = L.right.y = top + availH * 0.48;
    } else {
      const gap = Math.max(36, Math.min(52, availH * 0.08));
      const r = Math.min(availW * 0.38, (availH - gap) / 4.35, 168);
      L.left.r = L.right.r = r;
      L.left.x = L.right.x = W * 0.5;
      L.left.y = top + r + 6;
      L.right.y = H - bot - r - 22;
    }
  }

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.max(1, (W * dpr) | 0);
    canvas.height = Math.max(1, (H * dpr) | 0);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    layout();
  }

  function onPtrDown(e) {
    if (e.target.closest && (e.target.closest('button') || e.target.closest('.panel'))) return;
    if (G.mode !== 'play' || G.paused) return;
    ptr.down = true;
    ptr.id = e.pointerId;
    ptr.x = e.clientX;
    ptr.y = e.clientY;
    ptr.sx = e.clientX;
    ptr.sy = e.clientY;
    ptr.moved = 0;
    const plate = plateAt(e.clientX, e.clientY);
    if (plate) {
      const n = fromScreen(plate, e.clientX, e.clientY);
      G.aimX = n[0];
      G.aimY = n[1];
      clampAim();
    }
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (err) {}
  }

  function onPtrMove(e) {
    if (!ptr.down || e.pointerId !== ptr.id) {
      if (G.mode === 'play' && G.phase === 'seek' && !ptr.down) {
        const plate = plateAt(e.clientX, e.clientY);
        if (plate) {
          const n = fromScreen(plate, e.clientX, e.clientY);
          G.aimX = n[0];
          G.aimY = n[1];
          clampAim();
        }
      }
      return;
    }
    const dx = e.clientX - ptr.x;
    const dy = e.clientY - ptr.y;
    ptr.moved += Math.abs(dx) + Math.abs(dy);
    ptr.x = e.clientX;
    ptr.y = e.clientY;
    const plate = plateAt(e.clientX, e.clientY);
    if (plate) {
      const n = fromScreen(plate, e.clientX, e.clientY);
      G.aimX = n[0];
      G.aimY = n[1];
      clampAim();
    }
  }

  function onPtrUp(e) {
    if (!ptr.down || (ptr.id != null && e.pointerId !== ptr.id)) return;
    const moved = ptr.moved;
    ptr.down = false;
    ptr.id = null;
    if (G.mode !== 'play' || G.paused) return;
    if (moved < 14) {
      const plate = plateAt(e.clientX, e.clientY);
      if (plate) {
        const n = fromScreen(plate, e.clientX, e.clientY);
        G.aimX = n[0];
        G.aimY = n[1];
        clampAim();
        markNow();
      }
    }
  }

  function keyFlag(code, down) {
    if (code === 'ArrowLeft' || code === 'KeyA') keys.l = down;
    if (code === 'ArrowRight' || code === 'KeyD') keys.r = down;
    if (code === 'ArrowUp' || code === 'KeyW') keys.u = down;
    if (code === 'ArrowDown' || code === 'KeyS') keys.d = down;
  }

  window.addEventListener('keydown', function (e) {
    if (e.repeat && (e.code === 'Space' || e.code === 'Enter')) return;
    if (e.code === 'KeyM') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      e.preventDefault();
      return;
    }
    if (e.code === 'KeyR') {
      if (G.mode === 'play' || G.mode === 'end') {
        audio.ensure();
        startRun();
      }
      e.preventDefault();
      return;
    }
    if (e.code === 'Space' || e.code === 'Enter') {
      if (e.target && e.target.closest && e.target.closest('button')) return;
      if (G.mode === 'title' || G.mode === 'end') {
        audio.ensure();
        startRun();
        e.preventDefault();
        return;
      }
      if (G.mode === 'play') {
        markNow();
        e.preventDefault();
        return;
      }
    }
    keyFlag(e.code, true);
    if (
      e.code === 'ArrowLeft' ||
      e.code === 'ArrowRight' ||
      e.code === 'ArrowUp' ||
      e.code === 'ArrowDown' ||
      e.code === 'Space'
    ) {
      e.preventDefault();
    }
  });

  window.addEventListener('keyup', function (e) {
    keyFlag(e.code, false);
  });

  canvas.addEventListener('pointerdown', onPtrDown);
  window.addEventListener('pointermove', onPtrMove);
  window.addEventListener('pointerup', onPtrUp);
  window.addEventListener('pointercancel', onPtrUp);

  btnMain.addEventListener('click', function () {
    audio.ensure();
    startRun();
    btnMain.blur();
  });
  btnRetry.addEventListener('click', function () {
    audio.ensure();
    startRun();
    btnRetry.blur();
  });
  btnMark.addEventListener('click', function () {
    audio.ensure();
    markNow();
    btnMark.blur();
  });
  btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
    btnMute.blur();
  });

  document.addEventListener('visibilitychange', function () {
    G.paused = document.hidden;
    if (document.hidden) {
      keys.l = keys.r = keys.u = keys.d = false;
    }
  });

  window.addEventListener('resize', resize);

  spawnBackdrop();
  titleSky();
  showPanel('title');
  resize();
  refreshHud();
  if (location.hash === '#auto') {
    window.__spot = {
      start: startRun,
      mark: markNow,
      state: function () {
        return {
          mode: G.mode,
          phase: G.phase,
          round: G.round,
          lives: G.lives,
          hits: G.hits,
          remain: G.remain,
          result: G.result,
          why: G.why,
          target: G.sky ? G.sky.target : null,
          left: { x: L.left.x, y: L.left.y, r: L.left.r },
          right: { x: L.right.x, y: L.right.y, r: L.right.r },
          portrait: L.portrait
        };
      },
      aim: function (x, y) {
        G.aimX = x;
        G.aimY = y;
        clampAim();
      }
    };
    setTimeout(function () {
      startRun();
    }, 60);
  }

  let last = performance.now();
  let acc = 0;
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 5) {
      update(STEP);
      acc -= STEP;
      steps += 1;
    }
    if (acc >= STEP) acc = 0;
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
