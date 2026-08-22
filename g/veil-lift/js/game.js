'use strict';

(function () {
  const VW = 480;
  const VH = 680;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const LIFT_PX = 108;
  const TEAR_AT = 0.72;
  const MUTE_KEY = 'playbox-veil-lift-mute';
  const OPS = '拖穗子顺着纹路揭 · ←→ 选纱 · 空格揭 · M 静音';

  const MAG = { r: 255, g: 61, b: 184 };
  const CYN = { r: 0, g: 240, b: 255 };
  const GOLD = { r: 255, g: 227, b: 107 };
  const INK = { r: 246, g: 243, b: 255 };
  const PAL = [
    { r: 255, g: 61, b: 184, name: '粉' },
    { r: 0, g: 240, b: 255, name: '青' },
    { r: 255, g: 227, b: 107, name: '金' },
    { r: 199, g: 125, b: 255, name: '紫' },
    { r: 61, g: 255, b: 166, name: '翠' },
    { r: 255, g: 154, b: 86, name: '杏' }
  ];

  const STAGES = [
    {
      name: '一纱', sub: 'ONE', time: 0, yank: 2400, teach: true,
      hint: '抓住底下穗子，顺着往下揭',
      toast: '穗子往外拖，纱就起来',
      veils: [
        { x: 0.50, y: 0.50, rx: 0.36, ry: 0.40, rot: 0.08, tab: Math.PI * 0.52, col: 0, z: 0 }
      ]
    },
    {
      name: '双叠', sub: 'TWO', time: 0, yank: 2400, teach: true,
      hint: '粉压着青。先揭上面那层粉纱',
      toast: '交叉处完整的边在上',
      veils: [
        { x: 0.42, y: 0.56, rx: 0.31, ry: 0.33, rot: -0.12, tab: Math.PI * 0.78, col: 1, z: 0 },
        { x: 0.58, y: 0.42, rx: 0.29, ry: 0.31, rot: 0.16, tab: -0.42, col: 0, z: 1 }
      ]
    },
    {
      name: '三叠', sub: 'STACK', time: 0, yank: 2000, teach: true,
      hint: '一层压一层，从最上面揭起',
      toast: '粉压青，青压金',
      veils: [
        { x: 0.28, y: 0.52, rx: 0.26, ry: 0.32, rot: -0.18, tab: 2.65, col: 2, z: 0 },
        { x: 0.50, y: 0.48, rx: 0.26, ry: 0.31, rot: 0.04, tab: 1.25, col: 1, z: 1 },
        { x: 0.72, y: 0.50, rx: 0.26, ry: 0.32, rot: 0.18, tab: -0.28, col: 0, z: 2 }
      ]
    },
    {
      name: '分纱', sub: 'FORK', time: 50, yank: 1600, teach: false,
      hint: '左右两层互不压，谁先揭都行',
      toast: '粉和青都自由，金被压在下',
      veils: [
        { x: 0.50, y: 0.64, rx: 0.34, ry: 0.28, rot: 0.02, tab: Math.PI * 0.5, col: 2, z: 0 },
        { x: 0.28, y: 0.36, rx: 0.24, ry: 0.28, rot: -0.22, tab: 3.45, col: 0, z: 1 },
        { x: 0.72, y: 0.36, rx: 0.24, ry: 0.28, rot: 0.22, tab: -0.18, col: 1, z: 1 }
      ]
    },
    {
      name: '交叠', sub: 'CROSS', time: 44, yank: 1400, teach: false,
      hint: '交叉处完整的边在上。先揭粉纱',
      toast: '斜叠成叉，看谁盖住谁',
      veils: [
        { x: 0.50, y: 0.50, rx: 0.42, ry: 0.16, rot: 0.68, tab: 3.85, col: 1, z: 0 },
        { x: 0.50, y: 0.50, rx: 0.42, ry: 0.16, rot: -0.68, tab: 0.58, col: 0, z: 1 }
      ]
    },
    {
      name: '扇纱', sub: 'FAN', time: 52, yank: 1100, teach: false,
      hint: '五层扇开。先揭最上面那角',
      toast: '看最亮、最完整的那层边',
      veils: [
        { x: 0.50, y: 0.56, rx: 0.36, ry: 0.32, rot: 0.10, tab: 1.72, col: 2, z: 0 },
        { x: 0.32, y: 0.46, rx: 0.26, ry: 0.30, rot: -0.42, tab: 2.72, col: 3, z: 1 },
        { x: 0.68, y: 0.46, rx: 0.26, ry: 0.30, rot: 0.42, tab: 0.42, col: 4, z: 2 },
        { x: 0.42, y: 0.38, rx: 0.22, ry: 0.24, rot: -0.14, tab: 3.55, col: 1, z: 3 },
        { x: 0.58, y: 0.36, rx: 0.22, ry: 0.24, rot: 0.18, tab: -0.48, col: 0, z: 4 }
      ]
    },
    {
      name: '横纹', sub: 'BIAS', time: 40, yank: 780, teach: false,
      hint: '顺着穗子方向揭，别往错处拽',
      toast: '纹路朝穗子外侧，逆向会撕',
      veils: [
        { x: 0.48, y: 0.54, rx: 0.34, ry: 0.30, rot: 0.08, tab: Math.PI, col: 4, z: 0 },
        { x: 0.54, y: 0.42, rx: 0.30, ry: 0.28, rot: -0.10, tab: 0.04, col: 0, z: 1 }
      ]
    },
    {
      name: '脆丝', sub: 'BRITTLE', time: 36, yank: 280, teach: false,
      hint: '纱脆了。猛拽会撕，慢一点揭',
      toast: '按住「揭」比甩更快更稳',
      veils: [
        { x: 0.50, y: 0.58, rx: 0.34, ry: 0.28, rot: 0.00, tab: 1.58, col: 2, z: 0 },
        { x: 0.32, y: 0.40, rx: 0.24, ry: 0.26, rot: -0.28, tab: 2.90, col: 1, z: 1 },
        { x: 0.68, y: 0.40, rx: 0.24, ry: 0.26, rot: 0.28, tab: 0.22, col: 3, z: 1 },
        { x: 0.50, y: 0.36, rx: 0.26, ry: 0.22, rot: 0.06, tab: -1.20, col: 0, z: 2 }
      ]
    },
    {
      name: '织层', sub: 'WEAVE', time: 48, yank: 360, teach: false,
      hint: '看清楚谁压谁。小纱往往在上',
      toast: '两角先揭，再揭中间',
      veils: [
        { x: 0.50, y: 0.60, rx: 0.38, ry: 0.28, rot: 0.04, tab: 1.57, col: 2, z: 0 },
        { x: 0.26, y: 0.44, rx: 0.22, ry: 0.28, rot: -0.22, tab: 2.95, col: 1, z: 1 },
        { x: 0.74, y: 0.44, rx: 0.22, ry: 0.28, rot: 0.22, tab: 0.18, col: 4, z: 1 },
        { x: 0.50, y: 0.42, rx: 0.28, ry: 0.24, rot: 0.05, tab: -1.15, col: 3, z: 2 },
        { x: 0.36, y: 0.30, rx: 0.16, ry: 0.16, rot: -0.28, tab: 3.40, col: 0, z: 3 },
        { x: 0.64, y: 0.30, rx: 0.16, ry: 0.16, rot: 0.28, tab: -0.26, col: 5, z: 3 }
      ]
    },
    {
      name: '揭尽', sub: 'LAST', time: 42, yank: 240, teach: false,
      hint: '灯前最后一层层。慢揭，看叠压',
      toast: '最上面那一小块先走',
      veils: [
        { x: 0.50, y: 0.62, rx: 0.40, ry: 0.28, rot: 0.02, tab: 1.58, col: 2, z: 0 },
        { x: 0.24, y: 0.46, rx: 0.22, ry: 0.26, rot: -0.30, tab: 2.88, col: 1, z: 1 },
        { x: 0.76, y: 0.46, rx: 0.22, ry: 0.26, rot: 0.30, tab: 0.24, col: 4, z: 1 },
        { x: 0.50, y: 0.48, rx: 0.30, ry: 0.24, rot: 0.00, tab: 4.40, col: 3, z: 2 },
        { x: 0.36, y: 0.32, rx: 0.17, ry: 0.17, rot: -0.20, tab: 3.50, col: 0, z: 3 },
        { x: 0.64, y: 0.32, rx: 0.17, ry: 0.17, rot: 0.20, tab: -0.22, col: 5, z: 3 },
        { x: 0.50, y: 0.28, rx: 0.15, ry: 0.14, rot: 0.08, tab: -1.22, col: 1, z: 4 }
      ]
    }
  ];

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function rgb(c, a) {
    return a == null
      ? 'rgb(' + c.r + ',' + c.g + ',' + c.b + ')'
      : 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + a + ')';
  }
  function mix(a, b, t) {
    return {
      r: (lerp(a.r, b.r, t) + 0.5) | 0,
      g: (lerp(a.g, b.g, t) + 0.5) | 0,
      b: (lerp(a.b, b.b, t) + 0.5) | 0
    };
  }

  function ellPoint(v, ang, k) {
    k = k == null ? 1 : k;
    const wave = 1 + Math.sin(ang * 3 + v.phase) * 0.042 + Math.sin(ang * 7 + v.phase * 0.7) * 0.016;
    const lx = Math.cos(ang) * v.rx * wave * k;
    const ly = Math.sin(ang) * v.ry * wave * k;
    const ca = Math.cos(v.rot);
    const sa = Math.sin(v.rot);
    return {
      x: v.cx + lx * ca - ly * sa,
      y: v.cy + lx * sa + ly * ca
    };
  }

  function inEll(px, py, v) {
    const dx = px - v.cx;
    const dy = py - v.cy;
    const ca = Math.cos(-v.rot);
    const sa = Math.sin(-v.rot);
    const lx = dx * ca - dy * sa;
    const ly = dx * sa + dy * ca;
    return (lx * lx) / (v.rx * v.rx) + (ly * ly) / (v.ry * v.ry) <= 1.06;
  }

  function overlap(a, b) {
    if (inEll(a.cx, a.cy, b) || inEll(b.cx, b.cy, a)) return true;
    const n = 20;
    for (let i = 0; i < n; i++) {
      const t = (i / n) * TAU;
      const pa = ellPoint(a, t, 0.98);
      if (inEll(pa.x, pa.y, b)) return true;
      const pb = ellPoint(b, t, 0.98);
      if (inEll(pb.x, pb.y, a)) return true;
    }
    return false;
  }

  function makeVeil(d, i) {
    const fx = 44;
    const fy = 54;
    const fw = VW - 88;
    const fh = VH - 108;
    const s = Math.min(fw, fh);
    const v = {
      id: i,
      cx: fx + d.x * fw,
      cy: fy + d.y * fh,
      rx: d.rx * s,
      ry: d.ry * s,
      rot: d.rot || 0,
      tab: d.tab,
      col: d.col,
      z: d.z != null ? d.z : i,
      phase: d.phase != null ? d.phase : i * 1.17,
      lift: 0,
      strain: 0,
      out: false,
      gone: false,
      fly: 0
    };
    const p = ellPoint(v, v.tab, 1);
    const dx = p.x - v.cx;
    const dy = p.y - v.cy;
    const m = hypot(dx, dy) || 1;
    v.dx = dx / m;
    v.dy = dy / m;
    return v;
  }

  function tasselOf(v) {
    const p = ellPoint(v, v.tab, 1.02);
    const off = v.lift * 122;
    return { x: p.x + v.dx * off, y: p.y + v.dy * off };
  }

  function pinsAmong(list) {
    const pins = [];
    const n = list.length;
    for (let i = 0; i < n; i++) {
      if (list[i].out || list[i].gone) continue;
      for (let j = i + 1; j < n; j++) {
        if (list[j].out || list[j].gone) continue;
        if (!overlap(list[i], list[j])) continue;
        if (list[i].z === list[j].z) continue;
        if (list[i].z > list[j].z) pins.push([i, j]);
        else pins.push([j, i]);
      }
    }
    return pins;
  }

  function isPinned(list, idx) {
    const v = list[idx];
    if (!v || v.out || v.gone) return false;
    for (let i = 0; i < list.length; i++) {
      if (i === idx) continue;
      const o = list[i];
      if (o.out || o.gone) continue;
      if (o.z <= v.z) continue;
      if (overlap(v, o)) return true;
    }
    return false;
  }

  function isDag(n, pins) {
    const adj = [];
    const indeg = [];
    for (let i = 0; i < n; i++) {
      adj[i] = [];
      indeg[i] = 0;
    }
    for (let i = 0; i < pins.length; i++) {
      adj[pins[i][0]].push(pins[i][1]);
      indeg[pins[i][1]] += 1;
    }
    const q = [];
    for (let i = 0; i < n; i++) if (indeg[i] === 0) q.push(i);
    let seen = 0;
    while (q.length) {
      const u = q.pop();
      seen += 1;
      for (let k = 0; k < adj[u].length; k++) {
        const v = adj[u][k];
        indeg[v] -= 1;
        if (indeg[v] === 0) q.push(v);
      }
    }
    return seen === n;
  }

  function validateStages() {
    const errs = [];
    if (STAGES.length < 8) errs.push('need 8+ stages');
    for (let s = 0; s < STAGES.length; s++) {
      const st = STAGES[s];
      const list = [];
      for (let i = 0; i < st.veils.length; i++) list.push(makeVeil(st.veils[i], i));
      const n = list.length;
      const pins = pinsAmong(list);
      if (!isDag(n, pins)) errs.push('cycle ' + s + ' ' + st.name);
      let free = 0;
      for (let i = 0; i < n; i++) if (!isPinned(list, i)) free += 1;
      if (free < 1) errs.push('no free ' + s);
      if (s > 0 && n > 1 && pins.length < 1) errs.push('no pins ' + s);
      for (let i = 0; i < n; i++) {
        const t = tasselOf(list[i]);
        if (t.x < 18 || t.x > VW - 18 || t.y < 28 || t.y > VH - 18) {
          errs.push('tassel oob ' + s + ':' + i);
        }
      }
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const a = tasselOf(list[i]);
          const b = tasselOf(list[j]);
          if (hypot(a.x - b.x, a.y - b.y) < 26) {
            errs.push('tassel close ' + s + ':' + i + '/' + j);
          }
        }
      }
      const live = [];
      for (let i = 0; i < n; i++) live[i] = true;
      let peeled = 0;
      while (peeled < n) {
        let found = -1;
        for (let i = 0; i < n; i++) {
          if (!live[i]) continue;
          let pin = false;
          for (let j = 0; j < n; j++) {
            if (!live[j] || j === i) continue;
            if (list[j].z > list[i].z && overlap(list[i], list[j])) {
              pin = true;
              break;
            }
          }
          if (!pin) {
            found = i;
            break;
          }
        }
        if (found < 0) {
          errs.push('stuck peel ' + s);
          break;
        }
        live[found] = false;
        peeled += 1;
      }
    }
    return errs;
  }

  if (typeof document === 'undefined') {
    const errs = validateStages();
    if (errs.length) {
      console.error(errs.join('\n'));
      throw new Error('stage validation failed (' + errs.length + ')');
    }
    for (let s = 0; s < STAGES.length; s++) {
      const st = STAGES[s];
      const list = [];
      for (let i = 0; i < st.veils.length; i++) list.push(makeVeil(st.veils[i], i));
      const pins = pinsAmong(list);
      const free = [];
      for (let i = 0; i < list.length; i++) if (!isPinned(list, i)) free.push(i);
      console.log(
        s + ' ' + st.name + ' n=' + list.length + ' pins=' + pins.length +
        ' free=[' + free.join(',') + '] ' +
        pins.map(function (p) { return p[0] + '>' + p[1]; }).join(' ')
      );
    }
    console.log('veil-lift ok', STAGES.length);
    return;
  }

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: false });
  const stageEl = document.getElementById('stage');
  const overlay = document.getElementById('overlay');
  const panel = document.getElementById('panel');
  const ovKicker = document.getElementById('ov-kicker');
  const ovTitle = document.getElementById('ov-title');
  const ovLead = document.getElementById('ov-lead');
  const ovOps = document.getElementById('ov-ops');
  const ovBtn = document.getElementById('ov-btn');
  const stageLabel = document.getElementById('stage-label');
  const feelLabel = document.getElementById('feel-label');
  const timeLabel = document.getElementById('time-label');
  const fillWrap = document.getElementById('fill-wrap');
  const fillBar = document.getElementById('fill-bar');
  const fillNum = document.getElementById('fill-num');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnLift = document.getElementById('btn-lift');

  const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  const GRAB_R = coarse ? 46 : 34;

  let W = 1;
  let H = 1;
  let dpr = 1;
  let scale = 1;
  let ox = 0;
  let oy = 0;
  let hidden = false;

  const particles = [];
  const motes = [];
  const pips = [];
  const threads = [];

  const G = {
    mode: 'title',
    t: 0,
    clock: 0,
    stage: 0,
    lives: LIVES,
    time: 0,
    timeMax: 0,
    veils: [],
    sel: 0,
    lock: 0,
    settle: 0,
    toastT: 0,
    shake: 0,
    magFlash: 0,
    goldFlash: 0,
    why: '',
    keyLift: false,
    dragId: -1,
    dragSx: 0,
    dragSy: 0,
    lastPx: 0,
    lastPy: 0,
    yankWarn: false,
    pinWarn: false,
    dirWarn: false,
    hoverId: -1,
    lantern: 0,
    pulse: 0
  };

  const pointer = { down: false, x: VW * 0.5, y: VH * 0.5, id: null, hover: false };

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    lastRustle: -9,
    ensure() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.28;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.28;
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
    noise(dur, vol, hp) {
      if (!this.ctx || this.muted) return;
      const n = Math.max(0.04, dur);
      const sr = this.ctx.sampleRate;
      const buf = this.ctx.createBuffer(1, Math.max(1, Math.floor(sr * n)), sr);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = hp || 900;
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
    rustle() {
      if (G.clock - this.lastRustle < 0.08) return;
      this.lastRustle = G.clock;
      this.ensure();
      this.noise(0.07, 0.022, 1600);
    },
    lift() {
      this.ensure();
      this.beep(659, 0.1, 'sine', 0.055, 880);
      this.beep(988, 0.16, 'triangle', 0.04, 1320);
    },
    tick() {
      this.ensure();
      this.beep(784, 0.05, 'sine', 0.03);
    },
    warn() {
      this.ensure();
      this.beep(392, 0.08, 'sine', 0.04, 280);
    },
    tear() {
      this.ensure();
      this.noise(0.22, 0.08, 420);
      this.beep(196, 0.28, 'sawtooth', 0.06, 70);
    },
    dry() {
      this.ensure();
      this.beep(247, 0.2, 'triangle', 0.05, 90);
    },
    win() {
      this.ensure();
      this.beep(523, 0.12, 'sine', 0.07);
      this.beep(659, 0.14, 'sine', 0.06);
      this.beep(784, 0.16, 'sine', 0.06);
      this.beep(1046, 0.34, 'triangle', 0.07, 1560);
    },
    start() {
      this.ensure();
      this.beep(392, 0.1, 'sine', 0.045, 784);
    },
    lantern() {
      this.ensure();
      this.beep(523, 0.1, 'sine', 0.05, 523);
      this.beep(784, 0.2, 'triangle', 0.045, 1175);
    }
  };

  function toast(msg, warn, gold) {
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold && !warn);
    toastEl.classList.remove('hidden');
    G.toastT = 1.6;
  }

  function setHint(text, kind) {
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', kind === 'hot');
    hintEl.classList.toggle('warn', kind === 'warn');
  }

  function syncPips() {
    while (pips.length < LIVES) {
      const el = document.createElement('i');
      el.className = 'pip on';
      pipsEl.appendChild(el);
      pips.push(el);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].className = 'pip' + (i < G.lives ? ' on' : ' gone');
    }
  }

  function remainingCount() {
    let n = 0;
    for (let i = 0; i < G.veils.length; i++) {
      if (!G.veils[i].out && !G.veils[i].gone) n += 1;
    }
    return n;
  }

  function totalCount() {
    return G.veils.length;
  }

  function syncHud() {
    const st = STAGES[G.stage];
    const left = remainingCount();
    const tot = Math.max(1, totalCount());
    const grabbed = G.dragId >= 0 ? G.veils[G.dragId] : (G.keyLift ? G.veils[G.sel] : null);
    let k = left / tot;
    if (grabbed && !grabbed.out && grabbed.strain > 0.22) k = 1 - clamp(grabbed.strain, 0, 1);
    fillBar.style.transform = 'scaleX(' + clamp(k, 0, 1) + ')';
    fillNum.textContent = left + '/' + tot;
    const straining = grabbed && grabbed.strain > 0.28;
    const lifting = grabbed && grabbed.lift > 0.08 && grabbed.strain < 0.25;
    fillWrap.classList.toggle('warn', !!straining);
    fillWrap.classList.toggle('hot', !!lifting && !straining);
    if (G.mode === 'title') {
      fillBar.style.transform = 'scaleX(1)';
      fillNum.textContent = '10';
      fillWrap.classList.remove('warn', 'hot');
      stageLabel.textContent = '十层';
      feelLabel.textContent = '按序揭';
      feelLabel.className = '';
      timeLabel.textContent = '—';
      timeLabel.className = '';
    } else {
      stageLabel.textContent = '第 ' + (G.stage + 1) + ' 层 · ' + (st ? st.name : '');
      if (straining) {
        feelLabel.textContent = grabbed.strain > 0.5 ? '要撕了' : '压住了';
        feelLabel.className = 'warn';
      } else if (lifting) {
        feelLabel.textContent = '揭开';
        feelLabel.className = 'hot';
      } else {
        feelLabel.textContent = left ? '余 ' + left : '灯亮';
        feelLabel.className = left ? '' : 'hot';
      }
      if (G.timeMax > 0 && (G.mode === 'play' || G.mode === 'fail')) {
        const sec = Math.max(0, Math.ceil(G.time));
        timeLabel.textContent = sec + '″';
        timeLabel.className = G.time < 8 ? 'warn' : '';
      } else {
        timeLabel.textContent = '—';
        timeLabel.className = '';
      }
    }
    stageLabel.classList.toggle('hot', left === 0 && G.mode !== 'title');
    syncPips();
  }

  function showOverlay(kind, title, lead, btn, kicker, ops) {
    overlay.classList.remove('hidden');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kicker;
    ovTitle.textContent = title;
    ovLead.innerHTML = lead;
    ovBtn.textContent = btn;
    ovOps.textContent = ops || OPS;
  }

  function hideOverlay() {
    overlay.classList.add('hidden');
  }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 180) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j * 0.5, spec.j * 0.5),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life * rand(0.7, 1.2),
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        kind: spec.kind || 'cyan'
      });
    }
  }

  function emitThreads(x, y, dx, dy, col) {
    for (let i = 0; i < 10; i++) {
      if (threads.length > 40) threads.shift();
      const ang = Math.atan2(dy, dx) + rand(-0.9, 0.9);
      threads.push({
        x: x, y: y,
        vx: Math.cos(ang) * rand(40, 140),
        vy: Math.sin(ang) * rand(40, 140) + rand(20, 70),
        life: rand(0.35, 0.7),
        max: 0.7,
        len: rand(10, 22),
        col: col
      });
    }
  }

  function seedMotes() {
    motes.length = 0;
    for (let i = 0; i < 28; i++) {
      motes.push({
        x: rand(20, VW - 20),
        y: rand(20, VH - 20),
        r: rand(0.5, 1.7),
        a: rand(0.04, 0.14),
        p: rand(0, TAU),
        s: rand(3, 12)
      });
    }
  }

  function firstFree() {
    let best = -1;
    let bestZ = -999;
    for (let i = 0; i < G.veils.length; i++) {
      const v = G.veils[i];
      if (v.out || v.gone) continue;
      if (isPinned(G.veils, i)) continue;
      if (v.z > bestZ) {
        bestZ = v.z;
        best = i;
      }
    }
    if (best < 0) {
      for (let i = 0; i < G.veils.length; i++) {
        if (!G.veils[i].out && !G.veils[i].gone) return i;
      }
    }
    return best;
  }

  function applyStage(st) {
    G.veils = [];
    for (let i = 0; i < st.veils.length; i++) G.veils.push(makeVeil(st.veils[i], i));
    G.time = st.time || 0;
    G.timeMax = st.time || 0;
    G.sel = firstFree();
    G.dragId = -1;
    G.keyLift = false;
    G.yankWarn = false;
    G.pinWarn = false;
    G.dirWarn = false;
    G.lantern = 0;
    G.pulse = 0;
    G.why = '';
    btnLift.classList.remove('held');
  }

  function startStage(i) {
    G.mode = 'play';
    G.stage = i;
    G.lock = 0.18;
    applyStage(STAGES[i]);
    hideOverlay();
    setHint(STAGES[i].hint, '');
    toast(STAGES[i].toast || STAGES[i].name);
    syncHud();
    audio.start();
  }

  function startRun() {
    particles.length = 0;
    threads.length = 0;
    G.lives = LIVES;
    startStage(0);
  }

  function bootTitle() {
    particles.length = 0;
    G.lives = LIVES;
    G.stage = 0;
    G.mode = 'title';
    G.why = '';
    applyStage(STAGES[0]);
    showOverlay(
      'title',
      '揭纱',
      '灯被层层纱盖住。抓住穗子，按叠压顺序揭开。<br />压在底下的硬揭，纱会撕。',
      '开揭',
      'VEIL',
      OPS
    );
    setHint('先揭最上面那层 · 交叉处完整的边在上 · 撕了就输', '');
    syncHud();
  }

  function failStage(why) {
    if (G.mode !== 'play') return;
    G.mode = 'fail';
    G.why = why;
    G.lives -= 1;
    G.dragId = -1;
    G.keyLift = false;
    btnLift.classList.remove('held');
    G.magFlash = 0.55;
    G.shake = 10;
    syncHud();
    const more = G.lives > 0;
    let title = '撕了';
    let kicker = 'TEAR';
    let lead;
    if (why === 'dry') {
      title = '纱干了';
      kicker = 'DRY';
      lead = more
        ? '纱晾太久，一碰就裂。<br />还剩 ' + G.lives + ' 次。'
        : '纱干裂。十层未完。';
      audio.dry();
    } else {
      lead = more
        ? '压着的纱不能硬揭，猛拽也会撕。<br />还剩 ' + G.lives + ' 次。'
        : '纱撕了。十层未完。';
      audio.tear();
    }
    showOverlay('lose', title, lead, more ? '再揭这层' : '再来一局', kicker);
    setHint(why === 'dry' ? '快一点，纱会干' : '只揭最上面那层，顺着穗子走', 'warn');
  }

  function winRun() {
    G.mode = 'win';
    G.goldFlash = 0.9;
    audio.win();
    showOverlay('win', '灯亮了', '十层纱都揭开了。灯芯重新看见了你。', '再揭一巡', 'CLEAR');
    setHint('十层皆开', 'hot');
  }

  function completeVeil(v) {
    if (v.out) return;
    v.out = true;
    v.lift = Math.max(v.lift, 0.92);
    const t = tasselOf(v);
    const pal = PAL[v.col % PAL.length];
    emit(16, {
      x: t.x, y: t.y, j: 14,
      vx0: -70, vx1: 70, vy0: -110, vy1: -10,
      life: 0.65, r0: 1.1, r1: 3.0,
      kind: v.col === 2 ? 'gold' : (v.col === 1 ? 'cyan' : 'mag')
    });
    audio.lift();
    G.pulse = 1;
    const left = remainingCount();
    if (left <= 0) {
      G.lock = 0.85;
      G.goldFlash = 0.7;
      audio.lantern();
      toast('灯亮了', false, true);
      if (G.stage >= STAGES.length - 1) {
        winRun();
        return;
      }
      G.mode = 'clear';
      G.settle = 0.88;
    } else {
      if (STAGES[G.stage].teach) {
        G.sel = firstFree();
      } else {
        let pick = -1;
        for (let i = 0; i < G.veils.length; i++) {
          if (!G.veils[i].out && !G.veils[i].gone) {
            pick = i;
            break;
          }
        }
        G.sel = pick >= 0 ? pick : firstFree();
      }
      toast('还剩 ' + left + ' 层');
    }
  }

  function overlayAction() {
    audio.ensure();
    if (G.mode === 'title' || G.mode === 'win') {
      startRun();
      return;
    }
    if (G.mode === 'fail') {
      if (G.lives > 0) startStage(G.stage);
      else startRun();
    }
  }

  function cycleSel(dir) {
    const ids = [];
    for (let i = 0; i < G.veils.length; i++) {
      if (!G.veils[i].out && !G.veils[i].gone) ids.push(i);
    }
    if (!ids.length) return;
    let k = ids.indexOf(G.sel);
    if (k < 0) k = 0;
    k = (k + dir + ids.length) % ids.length;
    G.sel = ids[k];
    audio.tick();
  }

  function nearestTassel(x, y, extra) {
    extra = extra || 0;
    let best = -1;
    let bestD = GRAB_R + extra;
    for (let i = 0; i < G.veils.length; i++) {
      const v = G.veils[i];
      if (v.out || v.gone) continue;
      const t = tasselOf(v);
      const d = hypot(x - t.x, y - t.y);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }

  function ripVeil(v) {
    const t = tasselOf(v);
    emitThreads(t.x, t.y, v.dx, v.dy, PAL[v.col % PAL.length]);
    emit(20, {
      x: t.x, y: t.y, j: 18,
      vx0: -120, vx1: 120, vy0: -80, vy1: 90,
      life: 0.55, r0: 1, r1: 2.8, kind: 'mag'
    });
    failStage('tear');
  }

  function applyKeyPull(v, dt) {
    const pinned = isPinned(G.veils, v.id);
    if (pinned) {
      v.lift = Math.min(0.1, v.lift + dt * 0.18);
      v.strain += dt * 0.48;
      if (v.strain > 0.32 && !G.pinWarn) {
        G.pinWarn = true;
        toast('压住了 · 松开会回', true);
        audio.warn();
      }
    } else {
      v.lift = Math.min(1.08, v.lift + dt * 0.76);
      v.strain = Math.max(0, v.strain - dt * 0.5);
      audio.rustle();
    }
    if (v.strain >= TEAR_AT) {
      ripVeil(v);
      return;
    }
    if (!pinned && v.lift >= 0.88) completeVeil(v);
  }

  function applyPull(v, along, side, speed, dt) {
    const pinned = isPinned(G.veils, v.id);
    const st = STAGES[G.stage];
    const yank = st.yank || 1200;
    if (pinned) {
      const mag = Math.max(along, hypot(along, side * 0.6));
      v.lift = lerp(v.lift, clamp(mag / LIFT_PX, 0, 0.1), 1 - Math.exp(-14 * dt));
      v.strain = lerp(v.strain, clamp(mag / 74, 0, 1.1), 1 - Math.exp(-10 * dt));
      if (v.strain > 0.32 && !G.pinWarn) {
        G.pinWarn = true;
        toast('压住了 · 松开会回', true);
        audio.warn();
      }
    } else if (along > 6) {
      const liftT = clamp(along / LIFT_PX, 0, 1.08);
      v.lift = lerp(v.lift, liftT, 1 - Math.exp(-16 * dt));
      let extra = 0;
      if (side > along * 1.2) extra += (side - along) / 160;
      v.strain = lerp(v.strain, extra, 1 - Math.exp(-8 * dt));
      if (speed > yank) {
        v.strain = Math.min(1.1, v.strain + (speed / yank - 1) * 0.9 * dt);
        if (!G.yankWarn) {
          G.yankWarn = true;
          toast('太猛会撕', true);
          audio.warn();
        }
      }
      audio.rustle();
    } else if (along < -12) {
      v.lift = lerp(v.lift, 0, 1 - Math.exp(-10 * dt));
      v.strain = lerp(v.strain, clamp(-along / 88, 0, 1.1), 1 - Math.exp(-10 * dt));
      if (!G.dirWarn) {
        G.dirWarn = true;
        toast('顺着穗子往外揭', true);
        audio.warn();
      }
    } else {
      v.lift = lerp(v.lift, 0, 1 - Math.exp(-8 * dt));
      v.strain = lerp(v.strain, 0, 1 - Math.exp(-6 * dt));
    }
    if (v.strain >= TEAR_AT) {
      ripVeil(v);
      return;
    }
    if (!pinned && v.lift >= 0.88) completeVeil(v);
  }

  function springBack(v, dt) {
    if (v.out) {
      v.lift = Math.min(1.45, v.lift + dt * 1.6);
      v.fly += dt;
      if (v.lift > 1.28) v.gone = true;
      return;
    }
    v.lift = lerp(v.lift, 0, 1 - Math.exp(-11 * dt));
    v.strain = lerp(v.strain, 0, 1 - Math.exp(-5.5 * dt));
    if (v.lift < 0.01) v.lift = 0;
    if (v.strain < 0.01) v.strain = 0;
  }

  function update(dt) {
    G.t += dt;
    if (G.lock > 0) G.lock -= dt;
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) toastEl.classList.add('hidden');
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
    if (G.magFlash > 0) G.magFlash = Math.max(0, G.magFlash - dt * 1.8);
    if (G.goldFlash > 0) G.goldFlash = Math.max(0, G.goldFlash - dt * 1.4);
    if (G.pulse > 0) G.pulse = Math.max(0, G.pulse - dt * 1.6);

    const want = 1 - remainingCount() / Math.max(1, totalCount());
    G.lantern = lerp(G.lantern, want, 1 - Math.exp(-3.2 * dt));

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 70 * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = threads.length - 1; i >= 0; i--) {
      const th = threads[i];
      th.life -= dt;
      th.x += th.vx * dt;
      th.y += th.vy * dt;
      th.vy += 180 * dt;
      if (th.life <= 0) threads.splice(i, 1);
    }

    if (G.mode === 'clear') {
      G.settle -= dt;
      for (let i = 0; i < G.veils.length; i++) springBack(G.veils[i], dt);
      if (G.settle <= 0) startStage(G.stage + 1);
      syncHud();
      return;
    }

    const playing = G.mode === 'play' && G.lock <= 0;
    if (G.mode === 'play' && G.timeMax > 0 && playing) {
      G.time -= dt;
      if (G.time < 6 && G.time + dt >= 6) {
        toast('纱要干了', true);
        audio.warn();
      }
      if (G.time <= 0) {
        G.time = 0;
        failStage('dry');
      }
    }

    G.hoverId = pointer.hover ? nearestTassel(pointer.x, pointer.y, 10) : -1;

    if (playing) {
      const pulling = [];
      if (G.dragId >= 0 && pointer.down) {
        const v = G.veils[G.dragId];
        if (v && !v.out) {
          const dx = pointer.x - G.dragSx;
          const dy = pointer.y - G.dragSy;
          const along = dx * v.dx + dy * v.dy;
          const side = Math.abs(dx * v.dy - dy * v.dx);
          const speed = hypot(pointer.x - G.lastPx, pointer.y - G.lastPy) / Math.max(dt, 0.001);
          applyPull(v, along, side, speed, dt);
          pulling.push(v.id);
        }
      } else if (G.keyLift && G.sel >= 0) {
        const v = G.veils[G.sel];
        if (v && !v.out) {
          applyKeyPull(v, dt);
          pulling.push(v.id);
        }
      }

      if (G.mode === 'play') {
        for (let i = 0; i < G.veils.length; i++) {
          if (pulling.indexOf(i) < 0) springBack(G.veils[i], dt);
        }
      }
    } else if (G.mode === 'title') {
      const v = G.veils[0];
      if (v) v.lift = 0.04 + Math.sin(G.t * 1.1) * 0.03;
    } else {
      for (let i = 0; i < G.veils.length; i++) {
        if (G.veils[i].out) springBack(G.veils[i], dt);
      }
    }

    G.lastPx = pointer.x;
    G.lastPy = pointer.y;
    syncHud();
  }

  function sx(x) { return ox + x * scale; }
  function sy(y) { return oy + y * scale; }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function veilPath(v, k) {
    const n = 32;
    const off = v.lift * 122;
    const jx = v.strain * Math.sin(G.t * 38) * 2.4;
    const jy = v.strain * Math.cos(G.t * 31) * 1.8;
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * TAU;
      const p = ellPoint(v, a, k);
      const x = sx(p.x + v.dx * off + jx);
      const y = sy(p.y + v.dy * off + jy);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function drawLantern() {
    const x = sx(VW * 0.5);
    const y = sy(VH * 0.48);
    const s = scale;
    const glow = 0.18 + G.lantern * 0.72 + G.pulse * 0.2;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const grd = ctx.createRadialGradient(x, y, 6 * s, x, y, 130 * s);
    grd.addColorStop(0, 'rgba(255, 227, 107,' + (0.22 + glow * 0.45) + ')');
    grd.addColorStop(0.4, 'rgba(255, 61, 184,' + (0.08 + glow * 0.12) + ')');
    grd.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, 130 * s, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = rgb(CYN, 0.28 + glow * 0.4);
    ctx.lineWidth = 1.6 * s;
    roundRect(ctx, -22 * s, -30 * s, 44 * s, 62 * s, 6 * s);
    ctx.stroke();
    ctx.fillStyle = rgb(GOLD, 0.12 + glow * 0.28);
    roundRect(ctx, -18 * s, -26 * s, 36 * s, 52 * s, 4 * s);
    ctx.fill();
    ctx.strokeStyle = rgb(GOLD, 0.55 + glow * 0.35);
    ctx.lineWidth = 1.2 * s;
    ctx.beginPath();
    ctx.moveTo(-14 * s, -8 * s);
    ctx.lineTo(0, -22 * s);
    ctx.lineTo(14 * s, -8 * s);
    ctx.lineTo(0, 18 * s);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -2 * s, (4 + glow * 5) * s, 0, TAU);
    ctx.fillStyle = rgb(GOLD, 0.55 + glow * 0.4);
    ctx.fill();
    ctx.strokeStyle = rgb(MAG, 0.45);
    ctx.lineWidth = 1.1 * s;
    ctx.beginPath();
    ctx.moveTo(-10 * s, 26 * s);
    ctx.quadraticCurveTo(-12 * s, 40 * s, -8 * s, 48 * s);
    ctx.moveTo(10 * s, 26 * s);
    ctx.quadraticCurveTo(12 * s, 40 * s, 8 * s, 48 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -36 * s, 5 * s, 0, TAU);
    ctx.strokeStyle = rgb(CYN, 0.7);
    ctx.lineWidth = 1.3 * s;
    ctx.stroke();
    ctx.restore();
  }

  function drawVeil(v, teach) {
    const pal = PAL[v.col % PAL.length];
    const a = v.out ? clamp(1.2 - v.lift, 0, 0.7) : (0.30 + 0.14 * (v.z + 1) / 6);
    const alpha = a * (1 - v.lift * 0.35);
    const pinned = !v.out && isPinned(G.veils, v.id);
    const sel = G.sel === v.id && G.mode === 'play';
    const hover = G.hoverId === v.id || G.dragId === v.id;

    ctx.save();
    veilPath(v, 1);
    const t0 = tasselOf(v);
    const g0 = { x: v.cx - v.dx * v.rx, y: v.cy - v.dy * v.ry };
    const grd = ctx.createLinearGradient(sx(g0.x), sy(g0.y), sx(t0.x), sy(t0.y));
    const deep = mix({ r: 18, g: 8, b: 32 }, pal, 0.45);
    grd.addColorStop(0, rgb(deep, alpha * 0.85));
    grd.addColorStop(0.45, rgb(pal, alpha));
    grd.addColorStop(1, rgb(mix(pal, INK, 0.35), alpha * 1.05));
    ctx.fillStyle = grd;
    ctx.fill();

    ctx.save();
    ctx.clip();
    const sh = (Math.sin(G.t * 0.8 + v.phase) * 0.5 + 0.5);
    const mx = lerp(v.cx - v.rx, v.cx + v.rx, sh);
    const shine = ctx.createLinearGradient(sx(mx - 30), sy(v.cy), sx(mx + 40), sy(v.cy + 20));
    shine.addColorStop(0, 'rgba(255,255,255,0)');
    shine.addColorStop(0.5, 'rgba(255,255,255,' + (0.07 + (hover ? 0.05 : 0)) + ')');
    shine.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shine;
    ctx.fillRect(sx(v.cx - v.rx - 40), sy(v.cy - v.ry - 40), (v.rx * 2 + 80) * scale, (v.ry * 2 + 80) * scale);
    ctx.restore();

    ctx.strokeStyle = rgb(mix(pal, INK, 0.25), 0.55 + (sel ? 0.25 : 0));
    ctx.lineWidth = (1.5 + (hover ? 0.6 : 0)) * scale;
    veilPath(v, 1);
    ctx.stroke();

    ctx.strokeStyle = rgb(pal, 0.22);
    ctx.lineWidth = 1 * scale;
    ctx.setLineDash([5 * scale, 7 * scale]);
    veilPath(v, 0.86);
    ctx.stroke();
    ctx.setLineDash([]);

    const off = v.lift * 122;
    ctx.strokeStyle = rgb(mix(pal, INK, 0.5), 0.28);
    ctx.lineWidth = 1 * scale;
    for (let f = -1; f <= 1; f++) {
      const a0 = v.tab + Math.PI + f * 0.55;
      const a1 = v.tab + f * 0.35;
      const p0 = ellPoint(v, a0, 0.35);
      const p1 = ellPoint(v, a1, 0.92);
      ctx.beginPath();
      ctx.moveTo(sx(p0.x + v.dx * off), sy(p0.y + v.dy * off));
      ctx.quadraticCurveTo(
        sx(v.cx + v.dx * (off + 8) + f * 18),
        sy(v.cy + v.dy * (off + 8)),
        sx(p1.x + v.dx * off),
        sy(p1.y + v.dy * off)
      );
      ctx.stroke();
    }

    if (v.strain > 0.16) {
      const crack = clamp((v.strain - 0.16) / 0.56, 0, 1);
      ctx.strokeStyle = rgb(MAG, 0.4 + crack * 0.55);
      ctx.lineWidth = (1.1 + crack) * scale;
      ctx.beginPath();
      const c0 = tasselOf(v);
      ctx.moveTo(sx(c0.x), sy(c0.y));
      const steps = 6;
      for (let i = 1; i <= steps; i++) {
        const u = i / steps;
        const j = (i % 2 ? 1 : -1) * crack * 7;
        const px = c0.x - v.dx * u * (v.rx * 0.9 * crack) + v.dy * j;
        const py = c0.y - v.dy * u * (v.ry * 0.9 * crack) - v.dx * j;
        ctx.lineTo(sx(px), sy(py));
      }
      ctx.stroke();
    }

    const ts = tasselOf(v);
    const free = !pinned;
    const ring = (teach && free) || sel || hover;
    const rr = (9 + (ring ? 2.4 : 0) + Math.sin(G.t * 4 + v.phase) * (free ? 1.1 : 0)) * scale;
    ctx.beginPath();
    ctx.arc(sx(ts.x), sy(ts.y), rr, 0, TAU);
    ctx.fillStyle = rgb({ r: 10, g: 6, b: 20 }, 0.72);
    ctx.fill();
    ctx.strokeStyle = free ? rgb(CYN, ring ? 0.95 : 0.55) : rgb(MAG, ring ? 0.9 : 0.45);
    ctx.lineWidth = 1.8 * scale;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(sx(ts.x), sy(ts.y), rr * 0.38, 0, TAU);
    ctx.fillStyle = free ? rgb(CYN, 0.8) : rgb(MAG, 0.55);
    ctx.fill();

    ctx.strokeStyle = rgb(pal, 0.75);
    ctx.lineWidth = 1.2 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx(ts.x), sy(ts.y + 6));
    ctx.quadraticCurveTo(sx(ts.x - 4), sy(ts.y + 16), sx(ts.x - 2), sy(ts.y + 22));
    ctx.moveTo(sx(ts.x), sy(ts.y + 6));
    ctx.quadraticCurveTo(sx(ts.x + 5), sy(ts.y + 17), sx(ts.x + 3), sy(ts.y + 23));
    ctx.stroke();

    if ((teach && free && G.mode === 'play') || (sel && G.mode === 'play' && G.dragId < 0)) {
      const ax = ts.x + v.dx * 26;
      const ay = ts.y + v.dy * 26;
      ctx.strokeStyle = rgb(free ? CYN : MAG, 0.55 + 0.25 * Math.sin(G.t * 5));
      ctx.lineWidth = 1.6 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(ts.x + v.dx * 12), sy(ts.y + v.dy * 12));
      ctx.lineTo(sx(ax), sy(ay));
      ctx.stroke();
      const ang = Math.atan2(v.dy, v.dx);
      ctx.beginPath();
      ctx.moveTo(sx(ax), sy(ay));
      ctx.lineTo(sx(ax - Math.cos(ang - 0.5) * 7), sy(ay - Math.sin(ang - 0.5) * 7));
      ctx.moveTo(sx(ax), sy(ay));
      ctx.lineTo(sx(ax - Math.cos(ang + 0.5) * 7), sy(ay - Math.sin(ang + 0.5) * 7));
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFrame() {
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.22)';
    ctx.lineWidth = 5 * scale;
    roundRect(ctx, sx(8), sy(8), (VW - 16) * scale, (VH - 16) * scale, 14 * scale);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.2)';
    ctx.lineWidth = 1.6 * scale;
    roundRect(ctx, sx(16), sy(16), (VW - 32) * scale, (VH - 32) * scale, 10 * scale);
    ctx.stroke();
    const corners = [[28, 28], [VW - 28, 28], [28, VH - 28], [VW - 28, VH - 28]];
    ctx.fillStyle = rgb(GOLD, 0.55);
    for (let i = 0; i < corners.length; i++) {
      ctx.beginPath();
      ctx.arc(sx(corners[i][0]), sy(corners[i][1]), 3.2 * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawMotes() {
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const x = m.x + Math.sin(G.t * 0.4 + m.p) * 8;
      const y = (m.y + G.t * m.s) % VH;
      ctx.fillStyle = 'rgba(220, 210, 255,' + m.a + ')';
      ctx.beginPath();
      ctx.arc(sx(x), sy(y), m.r * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.kind === 'gold' ? '#ffe36b' : p.kind === 'mag' ? '#ff3db8' : '#00f0ff';
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * scale, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < threads.length; i++) {
      const th = threads[i];
      const a = clamp(th.life / th.max, 0, 1);
      ctx.strokeStyle = rgb(th.col, 0.25 + a * 0.6);
      ctx.lineWidth = 1.1 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(th.x), sy(th.y));
      ctx.lineTo(sx(th.x - th.vx * 0.05), sy(th.y - th.vy * 0.05 + th.len));
      ctx.stroke();
    }
  }

  function draw() {
    const shx = G.shake ? (Math.random() - 0.5) * G.shake * scale * 0.32 : 0;
    const shy = G.shake ? (Math.random() - 0.5) * G.shake * scale * 0.32 : 0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#05030c';
    ctx.fillRect(0, 0, W, H);

    const g1 = ctx.createRadialGradient(sx(70), sy(40), 8, sx(70), sy(40), 280 * scale);
    g1.addColorStop(0, 'rgba(255, 61, 184, 0.14)');
    g1.addColorStop(1, 'rgba(255, 61, 184, 0)');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, W, H);
    const g2 = ctx.createRadialGradient(sx(400), sy(70), 8, sx(400), sy(70), 260 * scale);
    g2.addColorStop(0, 'rgba(0, 240, 255, 0.1)');
    g2.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(shx, shy);
    ctx.beginPath();
    roundRect(ctx, sx(0), sy(0), VW * scale, VH * scale, 12 * scale);
    ctx.clip();

    ctx.fillStyle = '#070412';
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    drawLantern();
    drawMotes();

    const order = [];
    for (let i = 0; i < G.veils.length; i++) order.push(i);
    order.sort(function (a, b) {
      const va = G.veils[a];
      const vb = G.veils[b];
      if (va.out !== vb.out) return va.out ? 1 : -1;
      return va.z - vb.z;
    });
    const st = STAGES[G.stage];
    const teach = !!(st && st.teach);
    for (let i = 0; i < order.length; i++) {
      const v = G.veils[order[i]];
      if (v.gone) continue;
      drawVeil(v, teach);
    }

    drawParticles();
    drawFrame();
    ctx.restore();

    if (G.magFlash > 0) {
      ctx.fillStyle = 'rgba(255, 61, 184,' + (G.magFlash * 0.22) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    if (G.goldFlash > 0) {
      ctx.fillStyle = 'rgba(255, 227, 107,' + (G.goldFlash * 0.1) + ')';
      ctx.fillRect(0, 0, W, H);
    }
  }

  function pointerWorld(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / Math.max(1, rect.width));
    const y = (e.clientY - rect.top) * (H / Math.max(1, rect.height));
    return { x: (x - ox) / scale, y: (y - oy) / scale };
  }

  function resize() {
    const rect = stageEl.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    canvas.width = Math.max(1, (W * dpr) | 0);
    canvas.height = Math.max(1, (H * dpr) | 0);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    const fit = Math.min(W / VW, H / VH);
    scale = fit;
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function setKeyLift(on) {
    G.keyLift = on;
    btnLift.classList.toggle('held', on);
    if (on && G.mode === 'play') {
      G.yankWarn = false;
      G.pinWarn = false;
      G.dirWarn = false;
    }
  }

  function onKey(e, down) {
    const k = e.key;
    if (down && e.repeat && k !== ' ' && k !== 'Spacebar') return;
    if (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown' || k === ' ' || k === 'Spacebar') {
      e.preventDefault();
    }
    if (k === ' ' || k === 'Spacebar') {
      if (down && !overlay.classList.contains('hidden')) {
        overlayAction();
        return;
      }
      setKeyLift(down);
    }
    if (!down) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
    }
    if (k === 'r' || k === 'R') {
      audio.ensure();
      startRun();
    }
    if (k === 'Enter' && !overlay.classList.contains('hidden')) {
      overlayAction();
      return;
    }
    if (G.mode !== 'play' || G.lock > 0) return;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') cycleSel(-1);
    if (k === 'ArrowRight' || k === 'd' || k === 'D') cycleSel(1);
    if (k === 'ArrowUp' || k === 'w' || k === 'W') cycleSel(-1);
    if (k === 'ArrowDown' || k === 's' || k === 'S') cycleSel(1);
    if (k >= '1' && k <= '9') {
      const idx = k.charCodeAt(0) - 49;
      if (G.veils[idx] && !G.veils[idx].out && !G.veils[idx].gone) {
        G.sel = idx;
        audio.tick();
      }
    }
  }

  canvas.addEventListener('pointerdown', function (e) {
    if (e.button != null && e.button !== 0) return;
    audio.ensure();
    if (G.mode !== 'play' || G.lock > 0) return;
    const p = pointerWorld(e);
    pointer.down = true;
    pointer.hover = true;
    pointer.id = e.pointerId;
    pointer.x = p.x;
    pointer.y = p.y;
    G.lastPx = p.x;
    G.lastPy = p.y;
    const id = nearestTassel(p.x, p.y, 8);
    if (id >= 0) {
      G.dragId = id;
      G.sel = id;
      G.dragSx = p.x;
      G.dragSy = p.y;
      G.yankWarn = false;
      G.pinWarn = false;
      G.dirWarn = false;
      canvas.classList.add('drag');
    }
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    e.preventDefault();
  });
  canvas.addEventListener('pointermove', function (e) {
    const p = pointerWorld(e);
    pointer.x = p.x;
    pointer.y = p.y;
    if (e.pointerType === 'mouse') pointer.hover = true;
    const h = nearestTassel(p.x, p.y, 6);
    canvas.classList.toggle('hot', h >= 0 && G.dragId < 0);
  });
  function endPtr(e) {
    if (pointer.id != null && e.pointerId !== pointer.id) return;
    pointer.down = false;
    pointer.id = null;
    G.dragId = -1;
    canvas.classList.remove('drag');
    if (e.pointerType !== 'mouse') pointer.hover = false;
  }
  canvas.addEventListener('pointerup', endPtr);
  canvas.addEventListener('pointercancel', endPtr);
  canvas.addEventListener('pointerleave', function (e) {
    if (e.pointerType === 'mouse') pointer.hover = false;
  });
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('blur', function () {
    setKeyLift(false);
    G.dragId = -1;
    pointer.down = false;
  });

  ovBtn.addEventListener('click', function () {
    audio.ensure();
    overlayAction();
  });
  btnRetry.addEventListener('click', function () {
    audio.ensure();
    startRun();
  });
  btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  btnLift.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    audio.ensure();
    if (!overlay.classList.contains('hidden')) {
      overlayAction();
      return;
    }
    setKeyLift(true);
  });
  function liftUp() { setKeyLift(false); }
  btnLift.addEventListener('pointerup', liftUp);
  btnLift.addEventListener('pointerleave', liftUp);
  btnLift.addEventListener('pointercancel', liftUp);

  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (!hidden) {
      last = performance.now();
      acc = 0;
    } else {
      setKeyLift(false);
    }
  });

  window.addEventListener('resize', resize);

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
  } catch (err) { /* ignore */ }

  const bootErrs = validateStages();
  if (bootErrs.length) console.error(bootErrs.join('\n'));

  seedMotes();
  resize();
  bootTitle();
  syncHud();

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
    G.clock += dt;
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
