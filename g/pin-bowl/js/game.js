'use strict';

(function () {
  const VW = 480;
  const VH = 760;
  const RAIL_Y = 92;
  const DROP_Y = 126;
  const MOUTH_Y = 548;
  const FLOOR_Y = 686;
  const PIN_LEN = 50;
  const PIN_HEAD = 7.2;
  const GRAV = 980;
  const V0 = 56;
  const WIND_FOLLOW = 2.55;
  const AIM_ACC = 2460;
  const AIM_MAX = 500;
  const AIM_FRIC = 9.1;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const MUTE_KEY = 'playbox-pin-bowl-mute';
  const OPS = '← → / A D 瞄准 · 空格或点击落下 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];

  const STAGES = [
    {
      name: '初落', sub: 'FIRST',
      need: 1, ghost: true, inner: 0.78,
      hint: '碗滑到针下再落',
      toast: '对准碗口再落针',
      bowls: [{ kind: 'sine', cx: 240, amp: 78, period: 7.6, ph: 0, w: 148, gold: true }]
    },
    {
      name: '提前', sub: 'LEAD',
      need: 2, ghost: true, inner: 0.7,
      hint: '针要飞一会儿，对准落地时的碗',
      toast: '提前落，别等碗到正下',
      bowls: [{ kind: 'sine', cx: 240, amp: 132, period: 4.15, ph: 0.5, w: 116, gold: true }]
    },
    {
      name: '窄口', sub: 'NARROW',
      need: 2, inner: 0.66,
      hint: '碗口变窄了，对准正中',
      toast: '落点要进窄口',
      bowls: [{ kind: 'sine', cx: 240, amp: 128, period: 3.7, ph: 0.2, w: 84, gold: true }]
    },
    {
      name: '三针', sub: 'TRIO',
      need: 3, inner: 0.66,
      hint: '连投三针，都要进同一只碗',
      bowls: [{ kind: 'sine', cx: 240, amp: 146, period: 3.35, ph: 1.1, w: 90, gold: true }]
    },
    {
      name: '折返', sub: 'TURN',
      need: 3, inner: 0.64,
      hint: '两端会停一下，趁停手落',
      toast: '折返处碗会停',
      bowls: [{ kind: 'pause', cx: 240, amp: 154, period: 5.1, ph: 0, w: 82, gold: true, dwell: 0.17 }]
    },
    {
      name: '侧风', sub: 'WIND',
      need: 3, inner: 0.64,
      hint: '风会推针，看气流再提前',
      toast: '针会被风吹偏',
      wind: { amp: 88, period: 4.8, ph: 0.3 },
      bowls: [{ kind: 'sine', cx: 240, amp: 122, period: 3.55, ph: 0.7, w: 86, gold: true }]
    },
    {
      name: '盖合', sub: 'LID',
      need: 3, inner: 0.66,
      hint: '盖子合上时落不进去',
      toast: '等盖开再落',
      bowls: [{
        kind: 'sine', cx: 240, amp: 130, period: 3.6, ph: 0.15, w: 94, gold: true,
        lid: { period: 2.55, win: 0.56, ph: 0 }
      }]
    },
    {
      name: '金碗', sub: 'GOLD',
      need: 3, inner: 0.64,
      hint: '只要金碗，粉碗会弹飞针',
      toast: '粉碗是假的',
      bowls: [
        { kind: 'sine', cx: 240, amp: 148, period: 3.7, ph: 0, w: 80, gold: true },
        { kind: 'sine', cx: 240, amp: 148, period: 3.7, ph: Math.PI, w: 80, gold: false }
      ]
    },
    {
      name: '弹沿', sub: 'RIM',
      need: 4, inner: 0.5,
      hint: '碗沿会弹针，必须进正中',
      toast: '擦沿就算飞了',
      wind: { amp: 52, period: 3.6, ph: 1.1 },
      bowls: [{ kind: 'pause', cx: 240, amp: 150, period: 4.6, ph: 0.4, w: 72, gold: true, dwell: 0.12 }]
    },
    {
      name: '满匣', sub: 'CASE',
      need: 5, inner: 0.52,
      hint: '有风有盖，五针都要进金碗',
      toast: '金碗、开盖、避风',
      wind: { amp: 102, period: 3.9, ph: 0.5 },
      bowls: [
        {
          kind: 'sine', cx: 240, amp: 156, period: 3.2, ph: 0.35, w: 66, gold: true,
          lid: { period: 2.45, win: 0.54, ph: 0.12 }
        },
        { kind: 'sine', cx: 240, amp: 156, period: 3.2, ph: Math.PI + 0.35, w: 66, gold: false }
      ]
    }
  ];

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: false });
  const overlay = document.getElementById('overlay');
  const panel = document.getElementById('panel');
  const ovKicker = document.getElementById('ov-kicker');
  const ovTitle = document.getElementById('ov-title');
  const ovLead = document.getElementById('ov-lead');
  const ovOps = document.getElementById('ov-ops');
  const ovBtn = document.getElementById('ov-btn');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const fillWrap = document.getElementById('fill-wrap');
  const fillBar = document.getElementById('fill-bar');
  const fillNum = document.getElementById('fill-num');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');

  let W = 1;
  let H = 1;
  let dpr = 1;
  let scale = 1;
  let ox = 0;
  let oy = 0;
  let hidden = false;

  const keys = { l: false, r: false, drop: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, id: null };

  const particles = [];
  const motes = [];
  const rings = [];
  const pips = [];
  const gusts = [];
  const threads = [];

  const G = {
    mode: 'title',
    t: 0,
    clock: 0,
    stage: 0,
    lives: LIVES,
    fill: 0,
    need: 1,
    innerK: 0.7,
    ghost: false,
    wind: null,
    bowls: [],
    dropper: { x: VW * 0.5, vx: 0 },
    pin: { flying: false, x: 240, y: DROP_Y, vx: 0, vy: 0, rot: 0, vr: 0 },
    caught: [],
    cool: 0,
    jaw: 0,
    wantDrop: false,
    lock: 0,
    settle: 0,
    shake: 0,
    magFlash: 0,
    goldFlash: 0,
    toastT: 0,
    why: '',
    demoT: 0.8,
    ready: 1
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
  function sx(x) {
    return ox + x * scale;
  }
  function sy(y) {
    return oy + y * scale;
  }
  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function wrap01(u) {
    return u - Math.floor(u);
  }

  function aimBounds() {
    return { lo: 36, hi: VW - 36 };
  }

  function motionX(b, t) {
    const cx = b.cx;
    const amp = b.amp;
    if (b.kind === 'pause') {
      const dwell = b.dwell == null ? 0.16 : b.dwell;
      let u = t / b.period + (b.ph || 0) / TAU;
      u = wrap01(u);
      const m = Math.max(0.04, 0.5 - dwell);
      if (u < dwell) return cx - amp;
      if (u < dwell + m) {
        const k = (u - dwell) / m;
        const e = k * k * (3 - 2 * k);
        return cx + lerp(-amp, amp, e);
      }
      if (u < 0.5 + dwell) return cx + amp;
      const k = (u - (0.5 + dwell)) / m;
      const e = k * k * (3 - 2 * k);
      return cx + lerp(amp, -amp, e);
    }
    return cx + Math.sin(TAU * t / b.period + (b.ph || 0)) * amp;
  }

  function lidAmount(b, t) {
    if (!b.lid) return 1;
    const p = b.lid.period;
    const win = b.lid.win == null ? 0.55 : b.lid.win;
    let u = (t == null ? G.clock : t) / p + (b.lid.ph || 0);
    u = wrap01(u);
    if (u >= win) return 0;
    const edge = 0.16;
    const local = u / win;
    if (local < edge) return local / edge;
    if (local > 1 - edge) return (1 - local) / edge;
    return 1;
  }

  function windAt(t) {
    const w = G.wind;
    if (!w) return 0;
    return Math.sin(TAU * t / w.period + (w.ph || 0)) * w.amp;
  }

  function windNow() {
    return windAt(G.clock);
  }

  function fallTime() {
    const s = MOUTH_Y - (DROP_Y + PIN_LEN * 0.52);
    const a = 0.5 * GRAV;
    const disc = V0 * V0 + 4 * a * s;
    return (-V0 + Math.sqrt(Math.max(0, disc))) / (2 * a);
  }

  function predictLandX() {
    const tLand = fallTime();
    let x = G.dropper.x;
    let vx = G.dropper.vx * 0.14;
    const steps = Math.ceil(tLand / STEP);
    for (let i = 0; i < steps; i++) {
      const w = windAt(G.clock + i * STEP);
      vx += (w - vx) * WIND_FOLLOW * STEP;
      x += vx * STEP;
    }
    return clamp(x, 18, VW - 18);
  }

  const audio = {
    ctx: null,
    master: null,
    muted: false,
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
      const n = 0.1;
      const sr = this.ctx.sampleRate;
      const buf = this.ctx.createBuffer(1, Math.max(1, sr * n), sr);
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
    drop() {
      this.ensure();
      this.beep(1480, 0.08, 'triangle', 0.045, 620);
      this.beep(880, 0.05, 'sine', 0.03, 440);
    },
    catch() {
      this.ensure();
      this.noise(0.06, 0.04, 1800);
      this.beep(740, 0.09, 'sine', 0.07, 1180);
      this.beep(1175, 0.16, 'triangle', 0.04, 1560);
    },
    rim() {
      this.ensure();
      this.noise(0.09, 0.07, 700);
      this.beep(320, 0.12, 'square', 0.035, 90);
    },
    lid() {
      this.ensure();
      this.beep(210, 0.1, 'triangle', 0.05, 70);
      this.noise(0.08, 0.05, 400);
    },
    decoy() {
      this.ensure();
      this.beep(240, 0.16, 'sawtooth', 0.04, 80);
      this.beep(180, 0.22, 'sine', 0.05, 60);
    },
    miss() {
      this.ensure();
      this.beep(140, 0.16, 'sine', 0.05, 55);
    },
    lidOpen() {
      this.ensure();
      this.beep(640, 0.05, 'sine', 0.028);
    },
    clear() {
      this.ensure();
      this.beep(523, 0.12, 'sine', 0.06, 523);
      this.beep(659, 0.14, 'sine', 0.055, 659);
      this.beep(784, 0.22, 'triangle', 0.05, 1046);
    },
    win() {
      this.ensure();
      this.beep(523, 0.14, 'sine', 0.07);
      this.beep(659, 0.16, 'sine', 0.06);
      this.beep(784, 0.18, 'sine', 0.06);
      this.beep(1046, 0.36, 'triangle', 0.07, 1560);
    },
    start() {
      this.ensure();
      this.beep(392, 0.12, 'sine', 0.05, 784);
    }
  };

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 160) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j * 0.4, spec.j * 0.4),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life * rand(0.7, 1.15),
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        mag: !!spec.mag,
        gold: !!spec.gold,
        g: spec.g == null ? 420 : spec.g
      });
    }
  }

  function addRing(x, y, gold) {
    rings.push({ x: x, y: y, t: 0, gold: !!gold });
    if (rings.length > 16) rings.shift();
  }

  function toast(msg, warn, gold) {
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold && !warn);
    toastEl.classList.remove('hidden');
    G.toastT = 1.55;
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

  function syncHud() {
    const st = STAGES[G.stage];
    const need = G.need;
    const fill = G.fill;
    const k = need ? clamp(fill / need, 0, 1) : 0;
    fillBar.style.transform = 'scaleX(' + k + ')';
    fillNum.textContent = fill + '/' + need;
    const almost = G.mode === 'play' && fill === need - 1 && fill < need;
    fillWrap.classList.toggle('hot', G.mode === 'play' && fill >= need);
    fillWrap.classList.toggle('warn', almost);
    if (G.mode === 'title') {
      stageLabel.textContent = '十匣';
      tagLabel.textContent = '投针';
    } else {
      stageLabel.textContent = '第 ' + (G.stage + 1) + ' 匣 · ' + (st ? st.name : '');
      tagLabel.textContent = st ? st.sub : '';
    }
    stageLabel.classList.toggle('hot', G.mode === 'play' && fill >= need);
    tagLabel.classList.toggle('hot', G.mode === 'win' || (G.mode === 'play' && fill >= need));
    tagLabel.classList.toggle('warn', G.mode === 'fail');
    syncPips();
  }

  function setHint(text, kind) {
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', kind === 'hot');
    hintEl.classList.toggle('warn', kind === 'warn');
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

  function cloneBowl(src) {
    const b = {
      kind: src.kind,
      cx: src.cx,
      amp: src.amp,
      period: src.period,
      ph: src.ph || 0,
      w: src.w,
      gold: src.gold !== false,
      dwell: src.dwell,
      lid: src.lid ? {
        period: src.lid.period,
        win: src.lid.win,
        ph: src.lid.ph || 0
      } : null,
      x: src.cx,
      vx: 0,
      open: 1,
      prevOpen: 1
    };
    b.x = motionX(b, G.clock);
    b.open = lidAmount(b, G.clock);
    return b;
  }

  function applyStage(st) {
    G.need = st.need;
    G.fill = 0;
    G.innerK = st.inner == null ? 0.7 : st.inner;
    G.ghost = !!st.ghost;
    G.wind = st.wind ? {
      amp: st.wind.amp,
      period: st.wind.period,
      ph: st.wind.ph || 0
    } : null;
    G.bowls = [];
    for (let i = 0; i < st.bowls.length; i++) G.bowls.push(cloneBowl(st.bowls[i]));
    G.caught.length = 0;
    G.pin.flying = false;
    G.cool = 0;
    G.ready = 1;
    G.jaw = 0;
    G.wantDrop = false;
    G.why = '';
    G.settle = 0;
  }

  function startStage(i) {
    G.mode = 'play';
    G.stage = i;
    G.lock = 0.16;
    G.clock = 0;
    applyStage(STAGES[i]);
    hideOverlay();
    setHint(STAGES[i].hint, '');
    toast(STAGES[i].toast || STAGES[i].name);
    syncHud();
    audio.start();
  }

  function startRun() {
    particles.length = 0;
    rings.length = 0;
    G.lives = LIVES;
    G.dropper.x = VW * 0.5;
    G.dropper.vx = 0;
    startStage(0);
  }

  function bootTitle() {
    particles.length = 0;
    rings.length = 0;
    G.lives = LIVES;
    G.stage = 0;
    G.mode = 'title';
    G.clock = 0;
    G.why = '';
    G.demoT = 0.9;
    applyStage(STAGES[0]);
    G.ghost = true;
    showOverlay(
      'title',
      '投针',
      '针落下，要正好进移动的碗。<br />擦到碗沿会弹飞。',
      '开投',
      'PINS',
      OPS
    );
    setHint('瞄准落下 · 针要进碗', '');
    syncHud();
  }

  function canDrop() {
    if (G.pin.flying) return false;
    if (G.cool > 0) return false;
    if (G.lock > 0) return false;
    if (G.mode !== 'play' && G.mode !== 'title') return false;
    if (G.why) return false;
    if (G.mode === 'play' && G.fill >= G.need) return false;
    return true;
  }

  function dropPin() {
    if (!canDrop()) return;
    const p = G.pin;
    p.flying = true;
    p.x = G.dropper.x;
    p.y = DROP_Y;
    p.vx = G.dropper.vx * 0.14;
    p.vy = V0;
    p.rot = 0;
    p.vr = G.dropper.vx * 0.003;
    G.jaw = 1;
    G.ready = 0;
    addRing(p.x, DROP_Y + 8, false);
    if (G.mode === 'play') audio.drop();
  }

  function pinTip(p) {
    const len = PIN_LEN * 0.52;
    return {
      x: p.x + Math.sin(p.rot) * len,
      y: p.y + Math.cos(p.rot) * len
    };
  }

  function layoutCaught() {
    const groups = [];
    for (let i = 0; i < G.bowls.length; i++) groups.push([]);
    for (let i = 0; i < G.caught.length; i++) {
      const c = G.caught[i];
      if (groups[c.bi]) groups[c.bi].push(c);
    }
    for (let bi = 0; bi < groups.length; bi++) {
      const list = groups[bi];
      const b = G.bowls[bi];
      if (!b) continue;
      const n = list.length;
      const spread = Math.min(b.w * 0.26, 11 * Math.max(0, n - 1) * 0.5);
      for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0.5 : i / (n - 1);
        list[i].ox = lerp(-spread, spread, t);
        list[i].oy = 14 + (i % 3) * 3;
        list[i].lean = lerp(-0.16, 0.16, n === 1 ? 0.5 : t) + rand(-0.03, 0.03);
      }
    }
  }

  function catchPin(b) {
    const p = G.pin;
    p.flying = false;
    G.cool = 0.26;
    const bi = G.bowls.indexOf(b);
    G.caught.push({
      bi: bi < 0 ? 0 : bi,
      ox: p.x - b.x,
      oy: 16,
      lean: rand(-0.14, 0.14)
    });
    layoutCaught();
    addRing(b.x, MOUTH_Y + 4, true);
    emit(12, {
      x: b.x, y: MOUTH_Y + 6, j: 14,
      vx0: -80, vx1: 80, vy0: -140, vy1: -20,
      life: 0.5, r0: 1.1, r1: 3, gold: true, g: 240
    });
    if (G.mode !== 'play') {
      G.fill = Math.min(G.need, G.fill + 1);
      if (G.caught.length > 4) {
        G.caught.length = 0;
        G.fill = 0;
      }
      return;
    }
    G.fill += 1;
    G.goldFlash = 0.35;
    audio.catch();
    if (G.fill >= G.need) {
      clearStage();
    } else if (G.fill === G.need - 1) {
      toast('还差一针');
    }
    syncHud();
  }

  function missPin(reason, x, y) {
    G.pin.flying = false;
    G.cool = 0.3;
    const mag = reason !== 'floor';
    emit(reason === 'floor' ? 8 : 16, {
      x: x, y: y, j: 12,
      vx0: -90, vx1: 90, vy0: -120, vy1: 20,
      life: 0.48, r0: 1.1, r1: 3.2, mag: mag, g: 380
    });
    if (G.mode !== 'play' || G.why) return;
    G.why = reason;
    G.magFlash = 0.55;
    G.shake = reason === 'floor' ? 8 : 13;
    G.lock = 0.72;
    if (reason === 'rim') {
      audio.rim();
      toast('擦沿弹飞', true);
      setHint('碗沿会弹，对准正中', 'warn');
    } else if (reason === 'lid') {
      audio.lid();
      toast('盖子挡住了', true);
      setHint('等盖开再落', 'warn');
    } else if (reason === 'decoy') {
      audio.decoy();
      toast('进了粉碗', true);
      setHint('只要金碗', 'warn');
    } else {
      audio.miss();
      toast('针掉在桌上', true);
    }
    syncHud();
  }

  function failStage(why) {
    if (G.mode !== 'play') return;
    G.mode = 'fail';
    G.lives -= 1;
    syncHud();
    const more = G.lives > 0;
    const left = more
      ? '<br />还剩 ' + G.lives + ' 次。'
      : '';
    let title = '飞了';
    let kicker = 'MISSED';
    let lead = more
      ? '针没进碗。碗会动，要对准落地的位置。' + left
      : '针没进碗。十匣未完。';
    if (why === 'lid') {
      title = '盖住';
      kicker = 'SHUT';
      lead = more
        ? '盖子合上时针进不去。等盖开再落。' + left
        : '盖子合上时针进不去。十匣未完。';
    } else if (why === 'decoy') {
      title = '错碗';
      kicker = 'WRONG';
      lead = more
        ? '粉碗是假的，只要金碗。' + left
        : '粉碗是假的。十匣未完。';
    } else if (why === 'rim') {
      title = '弹飞';
      kicker = 'RIM';
      lead = more
        ? '擦到碗沿就会弹飞。对准正中。' + left
        : '擦到碗沿就会弹飞。十匣未完。';
    }
    showOverlay(
      'lose',
      title,
      lead,
      more ? '再试本匣' : '再来一局',
      kicker
    );
    setHint(more ? '还剩 ' + G.lives + ' 次' : '针全飞了', 'warn');
  }

  function clearStage() {
    if (G.mode !== 'play') return;
    G.lock = 0.85;
    G.goldFlash = 0.85;
    audio.clear();
    toast('这一匣进齐了', false, true);
    emit(18, {
      x: G.bowls[0] ? G.bowls[0].x : 240, y: MOUTH_Y + 24, j: 22,
      vx0: -70, vx1: 70, vy0: -90, vy1: -8,
      life: 0.7, r0: 1.2, r1: 3.2, gold: true, g: 180
    });
    if (G.stage >= STAGES.length - 1) {
      G.mode = 'win';
      audio.win();
      showOverlay(
        'win',
        '满匣',
        '十匣金针都落进了碗。',
        '再投一巡',
        'FULL CASE'
      );
      setHint('十匣皆满', 'hot');
      return;
    }
    G.mode = 'clear';
    G.settle = 1.05;
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

  function hitBowls(tip) {
    let catchB = null;
    let lidHit = null;
    let decoyHit = null;
    let rimHit = null;
    for (let i = 0; i < G.bowls.length; i++) {
      const b = G.bowls[i];
      const dx = Math.abs(tip.x - b.x);
      const outer = b.w * 0.5 + 5;
      if (dx > outer) continue;
      const inner = b.w * 0.5 * G.innerK;
      const open = b.open;
      if (dx <= inner) {
        if (open < 0.4) {
          if (!lidHit) lidHit = b;
        } else if (b.gold) {
          catchB = b;
        } else if (!decoyHit) {
          decoyHit = b;
        }
      } else if (open < 0.4) {
        if (!lidHit) lidHit = b;
      } else if (!rimHit) {
        rimHit = b;
      }
    }
    if (catchB) return { kind: 'catch', b: catchB };
    if (lidHit) return { kind: 'lid', b: lidHit };
    if (decoyHit) return { kind: 'decoy', b: decoyHit };
    if (rimHit) return { kind: 'rim', b: rimHit };
    return null;
  }

  function pointerWorldX(e) {
    const rect = canvas.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const x = (cssX / Math.max(1, rect.width)) * W;
    return (x - ox) / scale;
  }

  function resize() {
    const stage = document.getElementById('stage');
    const rect = stage.getBoundingClientRect();
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

  function seedMotes() {
    motes.length = 0;
    for (let i = 0; i < 42; i++) {
      motes.push({
        x: rand(16, VW - 16),
        y: rand(40, VH - 40),
        r: rand(0.55, 1.7),
        a: rand(0.04, 0.16),
        p: rand(0, TAU),
        s: rand(7, 20)
      });
    }
    gusts.length = 0;
    for (let i = 0; i < 10; i++) {
      gusts.push({
        x: rand(0, VW),
        y: rand(160, MOUTH_Y - 40),
        w: rand(26, 64),
        a: rand(0.05, 0.14),
        s: rand(50, 110)
      });
    }
    threads.length = 0;
    for (let i = 0; i < 7; i++) {
      threads.push({
        x: 28 + i * 68 + rand(-10, 10),
        len: rand(46, 110),
        ph: rand(0, TAU),
        mag: i % 2 === 0
      });
    }
  }

  function updateBowls(dt) {
    for (let i = 0; i < G.bowls.length; i++) {
      const b = G.bowls[i];
      const nx = motionX(b, G.clock);
      b.vx = (nx - b.x) / Math.max(dt, 0.001);
      b.x = nx;
      b.prevOpen = b.open;
      b.open = lidAmount(b, G.clock);
      if (G.mode === 'play' && b.lid && b.prevOpen < 0.35 && b.open >= 0.35) {
        audio.lidOpen();
      }
    }
  }

  function updateDropper(dt) {
    const b = aimBounds();
    const playing = G.mode === 'play' || G.mode === 'title';
    if (!playing) {
      G.dropper.vx *= Math.exp(-dt * 6);
      G.dropper.x = clamp(G.dropper.x + G.dropper.vx * dt, b.lo, b.hi);
      return;
    }
    if (G.mode === 'title') {
      const landT = fallTime();
      let tx = 240;
      for (let i = 0; i < G.bowls.length; i++) {
        if (G.bowls[i].gold) {
          tx = motionX(G.bowls[i], G.clock + landT);
          break;
        }
      }
      tx += Math.sin(G.clock * 0.7) * 10;
      const nx = lerp(G.dropper.x, clamp(tx, b.lo, b.hi), 1 - Math.exp(-5 * dt));
      G.dropper.vx = (nx - G.dropper.x) / Math.max(dt, 0.001);
      G.dropper.x = nx;
      return;
    }
    const usePtr = pointer.down || pointer.hover;
    if (usePtr) {
      const tx = clamp(pointer.x, b.lo, b.hi);
      const k = pointer.down ? 1 - Math.exp(-22 * dt) : 1 - Math.exp(-16 * dt);
      const nx = lerp(G.dropper.x, tx, k);
      G.dropper.vx = (nx - G.dropper.x) / Math.max(dt, 0.001);
      G.dropper.x = nx;
    } else {
      let ax = 0;
      if (keys.l) ax -= AIM_ACC;
      if (keys.r) ax += AIM_ACC;
      G.dropper.vx += ax * dt;
      if (!keys.l && !keys.r) G.dropper.vx *= Math.exp(-dt * AIM_FRIC);
      G.dropper.vx = clamp(G.dropper.vx, -AIM_MAX, AIM_MAX);
      G.dropper.x += G.dropper.vx * dt;
    }
    if (G.dropper.x < b.lo) {
      G.dropper.x = b.lo;
      G.dropper.vx *= 0.15;
    } else if (G.dropper.x > b.hi) {
      G.dropper.x = b.hi;
      G.dropper.vx *= 0.15;
    }
  }

  function updatePin(dt) {
    const p = G.pin;
    if (!p.flying) return;
    const w = windNow();
    p.vy += GRAV * dt;
    p.vx += (w - p.vx) * WIND_FOLLOW * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    const target = Math.atan2(p.vx, Math.max(40, p.vy));
    p.rot = lerp(p.rot, target, 1 - Math.exp(-8 * dt));
    if (p.x < 14) {
      p.x = 14;
      p.vx = Math.abs(p.vx) * 0.25;
    } else if (p.x > VW - 14) {
      p.x = VW - 14;
      p.vx = -Math.abs(p.vx) * 0.25;
    }
    const tip = pinTip(p);
    if (tip.y >= MOUTH_Y - 2 && tip.y <= MOUTH_Y + 46) {
      const hit = hitBowls(tip);
      if (hit) {
        if (hit.kind === 'catch') catchPin(hit.b);
        else missPin(hit.kind, tip.x, MOUTH_Y + 2);
        return;
      }
    }
    if (tip.y > FLOOR_Y - 6) {
      missPin('floor', tip.x, FLOOR_Y - 8);
    }
  }

  function updateFx(dt) {
    G.jaw = Math.max(0, G.jaw - dt * 3.2);
    if (!G.pin.flying && G.cool <= 0) {
      G.ready = lerp(G.ready, 1, 1 - Math.exp(-10 * dt));
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.life -= dt;
      q.vy += q.g * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vx *= Math.exp(-dt * 1.4);
      if (q.life <= 0) particles.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.55) rings.splice(i, 1);
    }
    const wind = windNow();
    for (let i = 0; i < gusts.length; i++) {
      const g = gusts[i];
      g.x += (wind * 0.85 + g.s * 0.15) * dt;
      if (g.x > VW + 40) g.x = -40;
      if (g.x < -40) g.x = VW + 40;
    }
  }

  function demoTick(dt) {
    G.demoT -= dt;
    if (G.demoT > 0) return;
    if (!canDrop()) {
      G.demoT = 0.25;
      return;
    }
    const landT = fallTime();
    let bx = 240;
    let open = 1;
    for (let i = 0; i < G.bowls.length; i++) {
      if (G.bowls[i].gold) {
        bx = motionX(G.bowls[i], G.clock + landT);
        open = lidAmount(G.bowls[i], G.clock + landT);
        break;
      }
    }
    if (open < 0.55) {
      G.demoT = 0.2;
      return;
    }
    if (Math.abs(G.dropper.x - bx) < 22) {
      dropPin();
      G.demoT = 1.7;
    } else {
      G.demoT = 0.12;
    }
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    G.lock = Math.max(0, G.lock - dt);
    G.cool = Math.max(0, G.cool - dt);
    G.shake *= Math.exp(-dt * 8);
    G.magFlash = Math.max(0, G.magFlash - dt);
    G.goldFlash = Math.max(0, G.goldFlash - dt);
    G.toastT = Math.max(0, G.toastT - dt);
    if (G.toastT <= 0) toastEl.classList.add('hidden');

    if (G.mode === 'play' && G.why && G.lock <= 0) {
      failStage(G.why);
      return;
    }

    if (G.mode === 'clear') {
      G.settle -= dt;
      updateBowls(dt);
      updateDropper(dt);
      updatePin(dt);
      updateFx(dt);
      if (G.settle <= 0) startStage(G.stage + 1);
      return;
    }

    if (G.mode === 'fail' || G.mode === 'win') {
      updateBowls(dt);
      updateDropper(dt);
      updatePin(dt);
      updateFx(dt);
      return;
    }

    updateBowls(dt);
    updateDropper(dt);
    if (G.mode === 'title') demoTick(dt);
    if (G.wantDrop) {
      G.wantDrop = false;
      if (G.mode === 'play' && overlay.classList.contains('hidden')) dropPin();
    }
    updatePin(dt);
    updateFx(dt);
  }

  function roundRect(c, x, y, w, h, r) {
    const rr = Math.min(r, w * 0.5, h * 0.5);
    c.beginPath();
    if (c.roundRect) {
      c.roundRect(x, y, w, h, rr);
      return;
    }
    c.moveTo(x + rr, y);
    c.lineTo(x + w - rr, y);
    c.quadraticCurveTo(x + w, y, x + w, y + rr);
    c.lineTo(x + w, y + h - rr);
    c.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    c.lineTo(x + rr, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - rr);
    c.lineTo(x, y + rr);
    c.quadraticCurveTo(x, y, x + rr, y);
    c.closePath();
  }

  function drawBg() {
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    g.addColorStop(0, '#080614');
    g.addColorStop(0.55, '#05030c');
    g.addColorStop(1, '#07040f');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const vg = ctx.createRadialGradient(sx(240), sy(360), 40 * scale, sx(240), sy(400), 420 * scale);
    vg.addColorStop(0, 'rgba(255, 61, 184, 0.05)');
    vg.addColorStop(0.45, 'rgba(0, 240, 255, 0.03)');
    vg.addColorStop(1, 'rgba(0, 0, 0, 0.28)');
    ctx.fillStyle = vg;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const a = m.a * (0.55 + 0.45 * Math.sin(G.t * 1.4 + m.p));
      ctx.fillStyle = rgba(i % 3 === 0 ? MAG : CYN, a);
      ctx.beginPath();
      ctx.arc(sx(m.x), sy(m.y + Math.sin(G.t * 0.6 + m.p) * m.s * 0.15), m.r * scale, 0, TAU);
      ctx.fill();
    }

    for (let i = 0; i < threads.length; i++) {
      const th = threads[i];
      const sway = Math.sin(G.t * 1.1 + th.ph) * 10;
      ctx.strokeStyle = th.mag ? 'rgba(255, 61, 184, 0.16)' : 'rgba(0, 240, 255, 0.14)';
      ctx.lineWidth = 1 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(th.x), sy(0));
      ctx.bezierCurveTo(
        sx(th.x + sway * 0.3), sy(th.len * 0.4),
        sx(th.x + sway), sy(th.len * 0.75),
        sx(th.x + sway * 1.1), sy(th.len)
      );
      ctx.stroke();
    }
  }

  function drawWind() {
    if (!G.wind) return;
    const w = windNow();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < gusts.length; i++) {
      const g = gusts[i];
      const a = g.a * (0.35 + Math.abs(w) / Math.max(40, G.wind.amp));
      ctx.strokeStyle = w >= 0 ? rgba(CYN, a) : rgba(MAG, a);
      ctx.lineWidth = 1.1 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(g.x), sy(g.y));
      ctx.lineTo(sx(g.x + Math.sign(w || 1) * g.w), sy(g.y + Math.sin(G.t * 3 + i) * 3));
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawRail() {
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.55)';
    ctx.lineWidth = 3.2 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx(22), sy(RAIL_Y));
    ctx.lineTo(sx(VW - 22), sy(RAIL_Y));
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.35)';
    ctx.lineWidth = 1.2 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(22), sy(RAIL_Y + 4));
    ctx.lineTo(sx(VW - 22), sy(RAIL_Y + 4));
    ctx.stroke();
    for (let i = 0; i < 9; i++) {
      const x = 40 + i * 50;
      ctx.strokeStyle = 'rgba(232, 250, 255, 0.12)';
      ctx.lineWidth = 1 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(x), sy(RAIL_Y - 6));
      ctx.lineTo(sx(x), sy(RAIL_Y + 8));
      ctx.stroke();
    }
  }

  function drawGhost() {
    if (!G.ghost || G.pin.flying) return;
    if (G.mode !== 'play' && G.mode !== 'title') return;
    const land = predictLandX();
    const tLand = fallTime();
    let over = false;
    for (let i = 0; i < G.bowls.length; i++) {
      const b = G.bowls[i];
      if (!b.gold) continue;
      const bx = motionX(b, G.clock + tLand);
      const open = lidAmount(b, G.clock + tLand);
      if (open > 0.4 && Math.abs(land - bx) < b.w * 0.5 * G.innerK) over = true;
    }
    const col = over ? 'rgba(255, 227, 107, 0.55)' : 'rgba(0, 240, 255, 0.28)';
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.15 * scale;
    ctx.setLineDash([5 * scale, 6 * scale]);
    ctx.beginPath();
    ctx.moveTo(sx(G.dropper.x), sy(DROP_Y + 18));
    ctx.lineTo(sx(land), sy(MOUTH_Y));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.ellipse(sx(land), sy(MOUTH_Y + 2), 10 * scale, 3.4 * scale, 0, 0, TAU);
    ctx.fill();
  }

  function drawPinShape(x, y, rot, k, flying) {
    const s = scale * (k || 1);
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.rotate(rot);
    const len = PIN_LEN * 0.5;
    if (flying) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.16)';
      ctx.lineWidth = 6 * s;
      ctx.beginPath();
      ctx.moveTo(0, -len * s);
      ctx.lineTo(0, len * s);
      ctx.stroke();
      ctx.restore();
    }
    ctx.strokeStyle = '#c8f6ff';
    ctx.lineWidth = 1.7 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -len * 0.55 * s);
    ctx.lineTo(0, len * 0.72 * s);
    ctx.stroke();
    ctx.fillStyle = '#f4ffff';
    ctx.beginPath();
    ctx.moveTo(0, len * s);
    ctx.lineTo(-2.4 * s, len * 0.7 * s);
    ctx.lineTo(2.4 * s, len * 0.7 * s);
    ctx.closePath();
    ctx.fill();
    const hr = PIN_HEAD * s;
    const hy = -len * 0.62 * s;
    const grd = ctx.createRadialGradient(-hr * 0.3, hy - hr * 0.25, hr * 0.15, 0, hy, hr);
    grd.addColorStop(0, '#fff0f8');
    grd.addColorStop(0.35, '#ff3db8');
    grd.addColorStop(1, '#7a1860');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(0, hy, hr, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.ellipse(-hr * 0.28, hy - hr * 0.28, hr * 0.28, hr * 0.18, -0.5, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawDropper() {
    const x = G.dropper.x;
    const y = RAIL_Y;
    const jaw = G.jaw * 5;
    ctx.save();
    ctx.fillStyle = '#12101c';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.8)';
    ctx.lineWidth = 1.5 * scale;
    roundRect(ctx, sx(x - 16), sy(y - 11), 32 * scale, 18 * scale, 4 * scale);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 227, 107, 0.85)';
    ctx.beginPath();
    ctx.arc(sx(x), sy(y - 2), 2.2 * scale, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.7)';
    ctx.lineWidth = 2 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx(x - 7 - jaw), sy(y + 8));
    ctx.lineTo(sx(x - 4 - jaw * 0.4), sy(y + 22));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx(x + 7 + jaw), sy(y + 8));
    ctx.lineTo(sx(x + 4 + jaw * 0.4), sy(y + 22));
    ctx.stroke();
    ctx.restore();

    if (!G.pin.flying && G.ready > 0.05) {
      const k = 0.72 + G.ready * 0.28;
      const py = lerp(DROP_Y - 26, DROP_Y, G.ready);
      drawPinShape(x, py, 0, k, false);
    }
  }

  function drawShelf() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(sx(240), sy(FLOOR_Y + 10), 190 * scale, 14 * scale, 0, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.22)';
    ctx.lineWidth = 6 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(18), sy(FLOOR_Y));
    ctx.lineTo(sx(VW - 18), sy(FLOOR_Y));
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.2)';
    ctx.lineWidth = 1.4 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(18), sy(FLOOR_Y + 6));
    ctx.lineTo(sx(VW - 18), sy(FLOOR_Y + 6));
    ctx.stroke();

    ctx.save();
    ctx.translate(sx(58), sy(FLOOR_Y - 2));
    ctx.fillStyle = '#1a0a16';
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.55)';
    ctx.lineWidth = 1.3 * scale;
    ctx.beginPath();
    ctx.ellipse(0, 0, 22 * scale, 10 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ff3db8';
    ctx.beginPath();
    ctx.ellipse(0, -2 * scale, 16 * scale, 7 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
    drawPinShape(50, FLOOR_Y - 28, -0.35, 0.55, false);
    drawPinShape(66, FLOOR_Y - 24, 0.4, 0.48, false);

    ctx.fillStyle = 'rgba(0, 240, 255, 0.12)';
    ctx.font = '600 ' + Math.max(9, 10 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('针匣', sx(VW - 28), sy(FLOOR_Y + 16));
  }

  function bowlPath(c, x, mouth, h, topH, botH) {
    const bottom = mouth + h;
    const r = 11 * scale;
    c.beginPath();
    c.moveTo(x - topH, mouth);
    c.lineTo(x + topH, mouth);
    c.lineTo(x + botH, bottom - r);
    c.quadraticCurveTo(x + botH, bottom, x + botH - r, bottom);
    c.lineTo(x - botH + r, bottom);
    c.quadraticCurveTo(x - botH, bottom, x - botH, bottom - r);
    c.closePath();
  }

  function drawBowl(b) {
    const x = sx(b.x);
    const mouth = sy(MOUTH_Y);
    const topH = b.w * 0.5 * scale;
    const botH = b.w * 0.33 * scale;
    const h = 70 * scale;
    const gold = b.gold;
    const rim = gold ? GOLD : MAG;
    const lean = clamp(-b.vx * 0.00035, -0.08, 0.08);

    ctx.save();
    ctx.translate(x, sy(FLOOR_Y - 8));
    ctx.rotate(lean);
    ctx.translate(-x, -sy(FLOOR_Y - 8));

    ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
    ctx.beginPath();
    ctx.ellipse(x, sy(FLOOR_Y + 4), topH * 0.92, 8 * scale, 0, 0, TAU);
    ctx.fill();

    bowlPath(ctx, x, mouth, h, topH, botH);
    ctx.fillStyle = gold ? 'rgba(10, 18, 36, 0.55)' : 'rgba(28, 8, 22, 0.55)';
    ctx.fill();

    ctx.save();
    bowlPath(ctx, x, mouth, h, topH * 0.9, botH * 0.9);
    ctx.clip();
    const lg = ctx.createLinearGradient(x, mouth, x, mouth + h);
    if (gold) {
      lg.addColorStop(0, 'rgba(0, 240, 255, 0.12)');
      lg.addColorStop(1, 'rgba(255, 227, 107, 0.16)');
    } else {
      lg.addColorStop(0, 'rgba(255, 61, 184, 0.14)');
      lg.addColorStop(1, 'rgba(80, 20, 60, 0.2)');
    }
    ctx.fillStyle = lg;
    ctx.fillRect(x - topH, mouth, topH * 2, h);
    ctx.restore();

    ctx.beginPath();
    ctx.ellipse(x, mouth + 2 * scale, topH * 0.82, 8.5 * scale, 0, 0, TAU);
    ctx.fillStyle = 'rgba(5, 3, 12, 0.72)';
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(x, mouth, topH, 11 * scale, 0, 0, TAU);
    ctx.strokeStyle = rgba(rim, 0.95);
    ctx.lineWidth = 2.4 * scale;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(x, mouth + 1 * scale, topH * 0.62, 6.5 * scale, 0, 0, TAU);
    ctx.strokeStyle = rgba(gold ? CYN : MAG, 0.35);
    ctx.lineWidth = 1.1 * scale;
    ctx.stroke();

    if (b.lid && b.open > 0.45) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = rgba(GOLD, 0.18 + b.open * 0.4);
      ctx.lineWidth = 2.2 * scale;
      ctx.beginPath();
      ctx.ellipse(x, mouth, topH * 0.7, 7.2 * scale, 0, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }

    bowlPath(ctx, x, mouth, h, topH, botH);
    ctx.strokeStyle = rgba(gold ? CYN : MAG, 0.75);
    ctx.lineWidth = 2 * scale;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1.3 * scale;
    ctx.beginPath();
    ctx.moveTo(x - topH * 0.55, mouth + 16 * scale);
    ctx.quadraticCurveTo(x - topH * 0.35, mouth + 36 * scale, x - botH * 0.45, mouth + h * 0.72);
    ctx.stroke();

    if (b.lid) {
      const open = b.open;
      const ang = lerp(0.08, -2.35, open);
      ctx.save();
      ctx.translate(x - topH * 0.15, mouth - 2 * scale);
      ctx.rotate(ang);
      ctx.fillStyle = gold ? 'rgba(18, 22, 40, 0.92)' : 'rgba(28, 10, 24, 0.92)';
      ctx.strokeStyle = rgba(rim, 0.9);
      ctx.lineWidth = 1.7 * scale;
      ctx.beginPath();
      ctx.ellipse(topH * 0.15, 0, topH * 0.92, 10 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = rgba(rim, 0.85);
      ctx.beginPath();
      ctx.arc(topH * 0.15, -2 * scale, 3.2 * scale, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    const bi = G.bowls.indexOf(b);
    for (let i = 0; i < G.caught.length; i++) {
      const c = G.caught[i];
      if (c.bi !== bi) continue;
      const wob = Math.sin(G.t * 6 + i) * 0.02 - b.vx * 0.00025;
      drawPinShape(b.x + c.ox, MOUTH_Y + c.oy - 22, c.lean + wob, 0.82, false);
    }

    ctx.restore();
  }

  function drawRings() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const k = r.t / 0.55;
      ctx.strokeStyle = r.gold ? rgba(GOLD, 0.55 * (1 - k)) : rgba(CYN, 0.4 * (1 - k));
      ctx.lineWidth = (2 - k) * scale;
      ctx.beginPath();
      ctx.ellipse(sx(r.x), sy(r.y), (12 + k * 38) * scale, (5 + k * 12) * scale, 0, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawParticles() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < particles.length; i++) {
      const q = particles[i];
      const a = clamp(q.life / q.max, 0, 1);
      ctx.fillStyle = q.gold ? rgba(GOLD, a) : q.mag ? rgba(MAG, a) : rgba(CYN, a);
      ctx.beginPath();
      ctx.arc(sx(q.x), sy(q.y), q.r * scale, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawFlash() {
    if (G.goldFlash > 0) {
      ctx.fillStyle = rgba(GOLD, G.goldFlash * 0.1);
      ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
    if (G.magFlash > 0) {
      ctx.fillStyle = rgba(MAG, G.magFlash * 0.12);
      ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
  }

  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#05030c';
    ctx.fillRect(0, 0, W, H);
    const shx = (Math.random() - 0.5) * G.shake * scale;
    const shy = (Math.random() - 0.5) * G.shake * scale;
    ctx.setTransform(1, 0, 0, 1, shx, shy);
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();
    drawBg();
    drawWind();
    drawRail();
    drawGhost();
    drawShelf();
    const order = G.bowls.slice().sort(function (a, b) {
      return (a.gold ? 1 : 0) - (b.gold ? 1 : 0);
    });
    for (let i = 0; i < order.length; i++) drawBowl(order[i]);
    if (G.pin.flying) drawPinShape(G.pin.x, G.pin.y, G.pin.rot, 1, true);
    drawDropper();
    drawRings();
    drawParticles();
    drawFlash();
    ctx.restore();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  function onKey(e, down) {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
    if (k === ' ' || k === 'Spacebar' || k === 'ArrowDown' || k === 'Down') {
      if (down && !keys.drop) {
        if (!overlay.classList.contains('hidden')) {
          e.preventDefault();
          overlayAction();
        } else {
          G.wantDrop = true;
        }
      }
      keys.drop = down;
      if (down) e.preventDefault();
    }
    if (down && (k === 'ArrowLeft' || k === 'ArrowRight')) e.preventDefault();
    if (!down) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
    }
    if (k === 'r' || k === 'R') {
      audio.ensure();
      startRun();
    }
    if (k === 'Enter') {
      if (!overlay.classList.contains('hidden')) {
        e.preventDefault();
        overlayAction();
      }
    }
  }

  canvas.addEventListener('pointerdown', function (e) {
    if (e.button != null && e.button !== 0) return;
    audio.ensure();
    pointer.down = true;
    pointer.hover = true;
    pointer.id = e.pointerId;
    pointer.x = pointerWorldX(e);
    const b = aimBounds();
    G.dropper.x = clamp(pointer.x, b.lo, b.hi);
    canvas.classList.add('press');
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    if (overlay.classList.contains('hidden')) G.wantDrop = true;
    e.preventDefault();
  });
  canvas.addEventListener('pointermove', function (e) {
    pointer.x = pointerWorldX(e);
    if (e.pointerType === 'mouse') pointer.hover = true;
  });
  function endPtr(e) {
    if (pointer.id != null && e.pointerId !== pointer.id) return;
    pointer.down = false;
    pointer.id = null;
    canvas.classList.remove('press');
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
    keys.l = false;
    keys.r = false;
    keys.drop = false;
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

  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (!hidden) {
      last = performance.now();
      acc = 0;
    }
  });

  window.addEventListener('resize', resize);

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
  } catch (err) { /* ignore */ }

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
