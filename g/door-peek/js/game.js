'use strict';

(function () {
  const VW = 480;
  const VH = 760;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const MUTE_KEY = 'playbox-door-peek-mute';
  const RISE = 0.16;
  const FALL = 0.18;
  const SWAP_T = 0.46;
  const OPS = '← → 选门 · 空格打开 · 点按门 · 1–6 · M 静音';

  const STAGES = [
    {
      name: '初窥',
      sub: 'FIRST',
      doors: 2,
      keys: 1,
      fakes: 0,
      peek: 1.18,
      peak: 0.66,
      bias: 0.82,
      seq: false,
      stagger: 0.06,
      swaps: 0,
      pickTime: 12,
      hint: '门会闪一条缝 · 记住有金钥的那扇'
    },
    {
      name: '三扇',
      sub: 'TRIO',
      doors: 3,
      keys: 1,
      fakes: 0,
      peek: 0.92,
      peak: 0.56,
      bias: 0.7,
      seq: false,
      stagger: 0.05,
      swaps: 0,
      pickTime: 10,
      hint: '三扇一起开，只取金钥'
    },
    {
      name: '快闪',
      sub: 'SNAP',
      doors: 3,
      keys: 1,
      fakes: 0,
      peek: 0.4,
      peak: 0.46,
      bias: 0.55,
      seq: false,
      stagger: 0.04,
      swaps: 0,
      pickTime: 8,
      hint: '缝更窄、更快 · 盯钥光'
    },
    {
      name: '双钥',
      sub: 'PAIR',
      doors: 4,
      keys: 2,
      fakes: 0,
      peek: 0.74,
      peak: 0.5,
      bias: 0.62,
      seq: false,
      stagger: 0.04,
      swaps: 0,
      pickTime: 11,
      hint: '两把金钥都要取 · 空门别碰'
    },
    {
      name: '假钥',
      sub: 'BAIT',
      doors: 4,
      keys: 1,
      fakes: 1,
      peek: 0.68,
      peak: 0.5,
      bias: 0.58,
      seq: false,
      stagger: 0.04,
      swaps: 0,
      pickTime: 9,
      hint: '品红是假钥 · 只要金色'
    },
    {
      name: '轮窥',
      sub: 'WAVE',
      doors: 4,
      keys: 1,
      fakes: 0,
      peek: 0.4,
      peak: 0.52,
      bias: 0.55,
      seq: true,
      order: 'ltr',
      gap: 0.16,
      swaps: 0,
      pickTime: 8,
      hint: '一扇一扇闪 · 等全部关完再选'
    },
    {
      name: '错位',
      sub: 'SWAP',
      doors: 4,
      keys: 1,
      fakes: 0,
      peek: 0.72,
      peak: 0.5,
      bias: 0.58,
      seq: false,
      stagger: 0.04,
      swaps: 1,
      pickTime: 8,
      hint: '关上门后会换位 · 跟着钥走'
    },
    {
      name: '夹闪',
      sub: 'OVER',
      doors: 5,
      keys: 2,
      fakes: 0,
      peek: 0.4,
      peak: 0.46,
      bias: 0.48,
      seq: true,
      order: 'rand',
      gap: -0.12,
      swaps: 0,
      pickTime: 9,
      hint: '两扇会叠着开 · 两把钥都要'
    },
    {
      name: '乱换',
      sub: 'SHELL',
      doors: 5,
      keys: 1,
      fakes: 1,
      peek: 0.46,
      peak: 0.44,
      bias: 0.42,
      seq: true,
      order: 'rand',
      gap: 0.08,
      swaps: 2,
      pickTime: 8,
      hint: '假钥也跟着换 · 盯金色'
    },
    {
      name: '终窥',
      sub: 'LAST',
      doors: 6,
      keys: 2,
      fakes: 1,
      peek: 0.32,
      peak: 0.4,
      bias: 0.28,
      seq: true,
      order: 'rand',
      gap: -0.06,
      swaps: 3,
      pickTime: 7,
      hint: '六扇、两钥、假钥、连换三次'
    }
  ];

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function smooth(t) {
    t = clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function randInt(n) {
    return Math.floor(Math.random() * n);
  }
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = randInt(i + 1);
      const t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    return arr;
  }

  function slotLayout(n) {
    const rows = n <= 4 ? [n] : n === 5 ? [3, 2] : [3, 3];
    const doorW = n <= 2 ? 124 : n === 3 ? 104 : n === 4 ? 88 : 86;
    const doorH = doorW * 1.88;
    const gapX = n === 4 ? 12 : 16;
    const gapY = 26;
    const totalH = rows.length * doorH + (rows.length - 1) * gapY;
    const y0 = (VH - totalH) * 0.42;
    const slots = [];
    for (let r = 0; r < rows.length; r++) {
      const cols = rows[r];
      const totalW = cols * doorW + (cols - 1) * gapX;
      const x0 = (VW - totalW) * 0.5;
      const y = y0 + r * (doorH + gapY);
      for (let c = 0; c < cols; c++) {
        slots.push({
          x: x0 + c * (doorW + gapX),
          y: y,
          w: doorW,
          h: doorH,
          row: r,
          col: c,
          cols: cols,
          rows: rows.length
        });
      }
    }
    return slots;
  }

  function dealKinds(n, nKeys, nFakes) {
    const kinds = [];
    for (let i = 0; i < nKeys; i++) kinds.push('key');
    for (let i = 0; i < nFakes; i++) kinds.push('fake');
    while (kinds.length < n) kinds.push('empty');
    return shuffle(kinds);
  }

  function makePeekEvents(n, spec) {
    const events = [];
    if (!spec.seq) {
      const stg = spec.stagger || 0;
      for (let i = 0; i < n; i++) {
        const t0 = 0.42 + i * stg;
        events.push({ i: i, t0: t0, t1: t0 + spec.peek });
      }
    } else {
      const order = [];
      for (let i = 0; i < n; i++) order.push(i);
      if (spec.order !== 'ltr') shuffle(order);
      let t = 0.38;
      const gap = spec.gap == null ? 0.14 : spec.gap;
      for (let k = 0; k < order.length; k++) {
        events.push({ i: order[k], t0: t, t1: t + spec.peek });
        t += spec.peek + gap;
      }
    }
    return events;
  }

  function peekOpenAt(t, ev, peak) {
    if (t < ev.t0) return 0;
    if (t < ev.t0 + RISE) return smooth((t - ev.t0) / RISE) * peak;
    if (t < ev.t1) return peak;
    if (t < ev.t1 + FALL) return (1 - smooth((t - ev.t1) / FALL)) * peak;
    return 0;
  }

  function watchEndOf(events) {
    let end = 0.8;
    for (let i = 0; i < events.length; i++) {
      const e = events[i].t1 + FALL + 0.08;
      if (e > end) end = e;
    }
    return end;
  }

  function makeSwaps(n, count) {
    const out = [];
    let prevA = -1;
    let prevB = -1;
    for (let k = 0; k < count; k++) {
      let a = 0;
      let b = 1;
      let guard = 0;
      do {
        a = randInt(n);
        b = randInt(n);
        guard += 1;
      } while ((b === a || (a === prevA && b === prevB) || (a === prevB && b === prevA)) && guard < 40);
      if (b === a) b = (a + 1 + randInt(n - 1)) % n;
      out.push([a, b]);
      prevA = a;
      prevB = b;
    }
    return out;
  }

  function validateStages() {
    if (STAGES.length < 8) throw new Error('need 8 stages');
    STAGES.forEach(function (s, i) {
      if (!s.name || !s.sub) throw new Error('name ' + i);
      if (s.doors < 2 || s.doors > 6) throw new Error('doors ' + i);
      if (s.keys < 1 || s.keys + s.fakes > s.doors) throw new Error('deal ' + i);
      if (s.peek < 0.2 || s.peak <= 0 || s.peak > 1) throw new Error('peek ' + i);
      if (s.pickTime < 4) throw new Error('time ' + i);
      const slots = slotLayout(s.doors);
      if (slots.length !== s.doors) throw new Error('layout ' + i);
    });
  }

  validateStages();

  if (typeof document === 'undefined') {
    console.log('door-peek stages', STAGES.length);
    return;
  }

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
  const keyWrap = document.getElementById('key-wrap');
  const keyBar = document.getElementById('key-bar');
  const keyNum = document.getElementById('key-num');
  const timeWrap = document.getElementById('time-wrap');
  const timeBar = document.getElementById('time-bar');
  const stageLabel = document.getElementById('stage-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');

  const coarse = window.matchMedia('(pointer: coarse)').matches;

  let W = 1;
  let H = 1;
  let dpr = 1;
  let scale = 1;
  let ox = 0;
  let oy = 0;
  let hidden = false;

  const pointer = { down: false, id: null, x: 0, y: 0 };
  const particles = [];
  const motes = [];
  const pips = [];

  const G = {
    mode: 'title',
    phase: 'watch',
    t: 0,
    clock: 0,
    stage: 0,
    lives: LIVES,
    got: 0,
    need: 1,
    doors: [],
    slots: [],
    doorOfSlot: [],
    peeks: [],
    watchEnd: 1,
    swapList: [],
    swapI: 0,
    swapOn: false,
    swapA: 0,
    swapB: 0,
    cursor: 0,
    phaseT: 0,
    pickLeft: 10,
    pickMax: 10,
    revealI: -1,
    judged: false,
    lock: 0,
    shake: 0,
    flash: 0,
    magFlash: 0,
    goldFlash: 0,
    toastT: 0,
    why: '',
    spec: STAGES[0],
    banner: '看',
    bannerA: 0
  };

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    ensure: function () {
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
    setMuted: function (m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.28;
      btnMute.textContent = m ? '静' : '声';
      btnMute.classList.toggle('muted', m);
      btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      try {
        localStorage.setItem(MUTE_KEY, m ? '1' : '0');
      } catch (err) { /* ignore */ }
    },
    beep: function (freq, dur, type, vol, slide) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.014);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + dur + 0.03);
    },
    noise: function (dur, vol, cut, type) {
      if (!this.ctx || this.muted) return;
      const n = Math.floor(this.ctx.sampleRate * Math.min(dur, 0.35));
      const buf = this.ctx.createBuffer(1, Math.max(1, n), this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = type || 'lowpass';
      f.frequency.value = cut || 900;
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
    creak: function () {
      this.ensure();
      this.noise(0.16, 0.05, 700);
      this.beep(180, 0.14, 'triangle', 0.03, 110);
    },
    slam: function () {
      this.ensure();
      this.noise(0.12, 0.07, 400);
      this.beep(70, 0.16, 'sine', 0.06, 42);
    },
    whoosh: function () {
      this.ensure();
      this.noise(0.22, 0.05, 1400, 'highpass');
      this.beep(240, 0.2, 'sine', 0.03, 90);
    },
    cue: function () {
      this.ensure();
      this.beep(523, 0.1, 'sine', 0.04, 784);
    },
    bump: function () {
      this.ensure();
      this.beep(110, 0.08, 'square', 0.03, 70);
    },
    open: function () {
      this.ensure();
      this.noise(0.1, 0.04, 800);
      this.beep(196, 0.12, 'triangle', 0.035, 140);
    },
    take: function () {
      this.ensure();
      this.beep(659, 0.12, 'sine', 0.07, 880);
      this.beep(784, 0.18, 'triangle', 0.05, 1175);
    },
    miss: function () {
      this.ensure();
      this.noise(0.22, 0.08, 500);
      this.beep(196, 0.32, 'sawtooth', 0.06, 70);
      this.beep(90, 0.4, 'sine', 0.05, 40);
    },
    clear: function () {
      this.ensure();
      this.beep(523, 0.12, 'sine', 0.06);
      this.beep(659, 0.14, 'sine', 0.055);
      this.beep(784, 0.22, 'triangle', 0.05, 1046);
    },
    win: function () {
      this.ensure();
      this.beep(523, 0.14, 'sine', 0.07);
      this.beep(659, 0.16, 'sine', 0.06);
      this.beep(784, 0.18, 'sine', 0.06);
      this.beep(1046, 0.36, 'triangle', 0.07, 1560);
    },
    start: function () {
      this.ensure();
      this.beep(392, 0.12, 'sine', 0.05, 784);
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.muted = true;
  } catch (err) { /* ignore */ }
  audio.setMuted(audio.muted);

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 160) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j * 0.5, spec.j * 0.5),
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

  function seedMotes() {
    motes.length = 0;
    for (let i = 0; i < 40; i++) {
      motes.push({
        x: rand(16, VW - 16),
        y: rand(40, VH - 40),
        r: rand(0.5, 1.7),
        a: rand(0.04, 0.14),
        p: rand(0, TAU),
        s: rand(7, 18)
      });
    }
  }

  function toast(msg, warn, gold) {
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold && !warn);
    toastEl.classList.remove('hidden');
    G.toastT = 1.55;
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

  function timeRatio() {
    if (G.mode === 'title') {
      const u = G.phaseT / Math.max(0.2, G.watchEnd);
      return clamp(u % 1, 0, 1);
    }
    if (G.phase === 'watch' || G.phase === 'intro') {
      return clamp(G.phaseT / Math.max(0.2, G.watchEnd), 0, 1);
    }
    if (G.phase === 'pick' || G.phase === 'reveal') {
      return clamp(G.pickLeft / Math.max(0.2, G.pickMax), 0, 1);
    }
    if (G.phase === 'swap' || G.phase === 'shut') return 1;
    return 0;
  }

  function syncHud() {
    const st = STAGES[G.stage];
    const need = G.need;
    const got = G.mode === 'title' ? 0 : G.got;
    const k = need ? clamp(got / need, 0, 1) : 0;
    keyBar.style.transform = 'scaleX(' + k + ')';
    keyNum.textContent = got + '/' + need;
    const tr = timeRatio();
    timeBar.style.transform = 'scaleX(' + tr + ')';
    const picking = G.mode === 'play' && G.phase === 'pick';
    const watching = G.mode === 'play' && (G.phase === 'watch' || G.phase === 'intro');
    const low = picking && G.pickLeft < 2.4;
    keyWrap.classList.toggle('hot', G.got > 0 && G.mode === 'play');
    timeWrap.classList.toggle('watch', watching);
    timeWrap.classList.toggle('hot', picking && !low);
    timeWrap.classList.toggle('warn', low || G.phase === 'reveal' && G.why);
    if (G.mode === 'title') {
      stageLabel.textContent = '十关';
    } else {
      stageLabel.textContent = '第 ' + (G.stage + 1) + ' 关 · ' + (st ? st.name : '');
    }
    stageLabel.classList.toggle('hot', G.mode === 'win' || G.phase === 'hold');
    stageLabel.classList.toggle('warn', G.mode === 'fail');
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

  function overlayOpen() {
    return !overlay.classList.contains('hidden');
  }

  function firstFreeSlot() {
    for (let i = 0; i < G.doors.length; i++) {
      const d = G.doors[G.doorOfSlot[i]];
      if (d && !d.collected) return i;
    }
    return 0;
  }

  function buildBoard(spec, demo) {
    const n = spec.doors;
    const slots = slotLayout(n);
    const kinds = dealKinds(n, spec.keys, spec.fakes);
    const doors = [];
    const doorOfSlot = [];
    for (let i = 0; i < n; i++) {
      const sl = slots[i];
      doors.push({
        kind: kinds[i],
        slot: i,
        open: 0,
        collected: false,
        visX: sl.x,
        visY: sl.y,
        fromX: sl.x,
        fromY: sl.y,
        toX: sl.x,
        toY: sl.y,
        lift: 0,
        swapK: 0,
        swapSign: 0,
        w: sl.w,
        h: sl.h,
        peeked: false
      });
      doorOfSlot[i] = i;
    }
    const peeks = makePeekEvents(n, spec);
    G.spec = spec;
    G.slots = slots;
    G.doors = doors;
    G.doorOfSlot = doorOfSlot;
    G.peeks = peeks;
    G.watchEnd = watchEndOf(peeks);
    G.swapList = spec.swaps ? makeSwaps(n, spec.swaps) : [];
    G.swapI = 0;
    G.swapOn = false;
    G.got = 0;
    G.need = spec.keys;
    G.cursor = 0;
    G.revealI = -1;
    G.judged = false;
    G.pickMax = spec.pickTime;
    G.pickLeft = spec.pickTime;
    G.why = '';
    G.banner = '看';
    G.bannerA = 0;
    if (!demo) {
      G.phase = 'intro';
      G.phaseT = 0;
    }
  }

  function enterPick() {
    G.phase = 'pick';
    G.phaseT = 0;
    G.pickLeft = G.pickMax;
    G.cursor = firstFreeSlot();
    G.banner = '选';
    G.bannerA = 1;
    toast('选');
    setHint(G.spec.hint, '');
    if (G.mode === 'play') audio.cue();
    syncHud();
  }

  function startStage(i) {
    G.mode = 'play';
    G.stage = i;
    G.lock = 0.14;
    G.why = '';
    G.judged = false;
    buildBoard(STAGES[i], false);
    hideOverlay();
    setHint(STAGES[i].hint, '');
    toast(STAGES[i].name);
    G.banner = '看';
    G.bannerA = 1;
    syncHud();
    audio.start();
  }

  function startRun() {
    particles.length = 0;
    G.lives = LIVES;
    startStage(0);
  }

  function bootTitle() {
    particles.length = 0;
    G.lives = LIVES;
    G.stage = 0;
    G.mode = 'title';
    G.why = '';
    buildBoard(STAGES[0], true);
    G.phase = 'watch';
    G.phaseT = 0;
    showOverlay(
      'title',
      '窥门',
      '门会闪开一条缝。记住金钥在哪一扇，<br />缝合后再打开。品红是假钥。',
      '开窥',
      'PEEK',
      coarse ? '点有金钥的门 · M 静音' : OPS
    );
    setHint(coarse ? '点有金钥的那扇门' : '门闪一条缝 · 只取金色的钥', '');
    syncHud();
  }

  function failStage(why) {
    if (G.mode !== 'play') return;
    G.mode = 'fail';
    G.phase = 'reveal';
    G.why = why;
    G.lives -= 1;
    G.magFlash = 0.7;
    G.shake = 12;
    audio.miss();
    syncHud();
    const more = G.lives > 0;
    let title = '看走眼';
    let lead;
    let kick = 'MISS';
    if (why === 'fake') {
      title = '假钥';
      kick = 'BAIT';
      lead = more
        ? '品红是诱饵。只要金色那把。<br />还剩 ' + G.lives + ' 次。'
        : '品红是诱饵。十关未完。';
    } else if (why === 'time') {
      title = '超时';
      kick = 'LATE';
      lead = more
        ? '缝已经合上，钥还在门后。<br />还剩 ' + G.lives + ' 次。'
        : '来不及选了。十关未完。';
    } else {
      lead = more
        ? '那扇后面是空的。金钥在另一扇。<br />还剩 ' + G.lives + ' 次。'
        : '打开了空门。十关未完。';
    }
    toast(title, true);
    setHint(title, 'warn');
    showOverlay('lose', title, lead, more ? '再试本关' : '再来一局', kick);
  }

  function clearStage() {
    if (G.mode !== 'play' && G.mode !== 'hold') return;
    G.lock = 0.85;
    G.goldFlash = 0.8;
    audio.clear();
    toast(STAGES[G.stage].name + ' · 钥齐', false, true);
    if (G.stage >= STAGES.length - 1) {
      G.mode = 'win';
      audio.win();
      showOverlay(
        'win',
        '钥齐',
        '十道门后的金钥都拿到了。',
        '再窥一轮',
        'ALL KEYS'
      );
      setHint('十关金钥都在手里', 'hot');
      syncHud();
      return;
    }
    G.mode = 'clear';
    G.phase = 'hold';
    G.phaseT = 0;
    setHint('下一关马上闪', 'hot');
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

  function doorAtSlot(slot) {
    const i = G.doorOfSlot[slot];
    return i == null ? null : G.doors[i];
  }

  function tryPick(slot) {
    if (G.mode !== 'play' || G.phase !== 'pick' || G.lock > 0) return;
    if (slot < 0 || slot >= G.doors.length) return;
    const d = doorAtSlot(slot);
    if (!d) return;
    if (d.collected) {
      audio.bump();
      toast('已经取过');
      return;
    }
    G.cursor = slot;
    G.phase = 'reveal';
    G.phaseT = 0;
    G.revealI = G.doorOfSlot[slot];
    G.judged = false;
    G.lock = 0.2;
    audio.open();
  }

  function judge(d) {
    const cx = d.visX + d.w * 0.55;
    const cy = d.visY + d.h * 0.42;
    if (d.kind === 'key') {
      d.collected = true;
      G.got += 1;
      audio.take();
      G.goldFlash = 0.45;
      emit(16, {
        x: cx, y: cy, j: 16,
        vx0: -80, vx1: 80, vy0: -160, vy1: -20,
        life: 0.7, r0: 1.4, r1: 3.4, gold: true, g: 220
      });
      syncHud();
      if (G.got >= G.need) {
        G.phase = 'hold';
        G.phaseT = 0;
        G.mode = 'play';
        G.banner = '钥';
        G.bannerA = 1;
        return;
      }
      G.phase = 'pick';
      G.phaseT = 0;
      G.judged = false;
      G.pickLeft = Math.min(G.pickMax, G.pickLeft + 1.4);
      G.cursor = firstFreeSlot();
      toast('还有 ' + (G.need - G.got) + ' 把', false, true);
    } else {
      emit(18, {
        x: cx, y: cy, j: 14,
        vx0: -110, vx1: 110, vy0: -140, vy1: 10,
        life: 0.65, r0: 1.4, r1: 3.6, mag: true, g: 380
      });
      failStage(d.kind === 'fake' ? 'fake' : 'empty');
    }
  }

  function nav(from, dir) {
    const sl = G.slots[from];
    if (!sl) return from;
    if (dir === 'l' || dir === 'r') {
      const step = dir === 'l' ? -1 : 1;
      let col = sl.col + step;
      if (col < 0) col = sl.cols - 1;
      if (col >= sl.cols) col = 0;
      for (let i = 0; i < G.slots.length; i++) {
        if (G.slots[i].row === sl.row && G.slots[i].col === col) return i;
      }
      return from;
    }
    const wantRow = dir === 'u' ? sl.row - 1 : sl.row + 1;
    if (wantRow < 0 || wantRow >= sl.rows) return from;
    const cx = sl.x + sl.w * 0.5;
    let best = from;
    let bestD = 1e9;
    for (let i = 0; i < G.slots.length; i++) {
      if (G.slots[i].row !== wantRow) continue;
      const d = Math.abs(G.slots[i].x + G.slots[i].w * 0.5 - cx);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }

  function hitSlot(wx, wy) {
    let best = -1;
    let bestA = 0;
    for (let i = 0; i < G.doors.length; i++) {
      const d = G.doors[i];
      const x = d.visX;
      const y = d.visY - d.lift;
      if (wx >= x && wx <= x + d.w && wy >= y && wy <= y + d.h) {
        const a = d.w * d.h + d.lift * 20;
        if (a >= bestA) {
          bestA = a;
          best = d.slot;
        }
      }
    }
    return best;
  }

  function worldFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / Math.max(1, rect.width) * W;
    const y = (e.clientY - rect.top) / Math.max(1, rect.height) * H;
    return { x: (x - ox) / scale, y: (y - oy) / scale };
  }

  function beginSwapPair(a, b) {
    const da = G.doorOfSlot[a];
    const db = G.doorOfSlot[b];
    const sa = G.slots[a];
    const sb = G.slots[b];
    G.doors[da].fromX = sa.x;
    G.doors[da].fromY = sa.y;
    G.doors[da].toX = sb.x;
    G.doors[da].toY = sb.y;
    G.doors[db].fromX = sb.x;
    G.doors[db].fromY = sb.y;
    G.doors[db].toX = sa.x;
    G.doors[db].toY = sa.y;
    G.doors[da].slot = b;
    G.doors[db].slot = a;
    G.doorOfSlot[a] = db;
    G.doorOfSlot[b] = da;
    G.doors[da].swapSign = 1;
    G.doors[db].swapSign = -1;
    G.doors[da].swapK = 0;
    G.doors[db].swapK = 0;
    G.swapA = da;
    G.swapB = db;
    if (G.mode === 'play') audio.whoosh();
  }

  function updateDoors(dt) {
    const peak = G.spec.peak || 0.5;
    for (let i = 0; i < G.doors.length; i++) {
      const d = G.doors[i];
      let want = 0;
      if (G.phase === 'watch' || (G.mode === 'title' && G.phase === 'watch')) {
        for (let p = 0; p < G.peeks.length; p++) {
          if (G.peeks[p].i !== i) continue;
          const amt = peekOpenAt(G.phaseT, G.peeks[p], peak);
          if (amt > want) want = amt;
        }
        if (want > 0.12 && !d.peeked && G.mode === 'play') {
          d.peeked = true;
          audio.creak();
          const cx = d.visX + d.w * 0.72;
          const cy = d.visY + d.h * 0.45;
          emit(6, {
            x: cx, y: cy, j: 8,
            vx0: 10, vx1: 50, vy0: -40, vy1: 10,
            life: 0.4, r0: 1, r1: 2.2,
            gold: d.kind === 'key', mag: d.kind === 'fake', g: 80
          });
        }
      } else if (G.phase === 'reveal' && i === G.revealI) {
        want = 1;
      } else if (d.collected) {
        want = 0.22;
      } else if (G.mode === 'fail' && i === G.revealI) {
        want = 1;
      } else if (G.mode === 'win' && d.kind === 'key') {
        want = 0.7;
      }
      const rate = want < d.open ? 14 : 9;
      d.open = lerp(d.open, want, 1 - Math.exp(-dt * rate));
      if (Math.abs(d.open - want) < 0.004) d.open = want;

      if (!(G.phase === 'swap' && G.swapOn && (i === G.swapA || i === G.swapB))) {
        const sl = G.slots[d.slot];
        const k = 1 - Math.exp(-dt * 14);
        d.visX = lerp(d.visX, sl.x, k);
        d.visY = lerp(d.visY, sl.y, k);
        d.lift = lerp(d.lift, 0, 1 - Math.exp(-dt * 10));
      }
    }
  }

  function updateSwap(dt) {
    G.phaseT += dt;
    if (!G.swapOn) {
      if (G.phaseT > 0.14) {
        const pair = G.swapList[G.swapI];
        beginSwapPair(pair[0], pair[1]);
        G.swapOn = true;
        G.phaseT = 0;
      }
      return;
    }
    const k = clamp(G.phaseT / SWAP_T, 0, 1);
    const e = smooth(k);
    const da = G.doors[G.swapA];
    const db = G.doors[G.swapB];
    da.visX = lerp(da.fromX, da.toX, e);
    da.visY = lerp(da.fromY, da.toY, e);
    db.visX = lerp(db.fromX, db.toX, e);
    db.visY = lerp(db.fromY, db.toY, e);
    da.lift = Math.sin(Math.PI * e) * 28;
    db.lift = -Math.sin(Math.PI * e) * 22;
    da.swapK = e;
    db.swapK = e;
    if (k >= 1) {
      da.lift = 0;
      db.lift = 0;
      G.swapI += 1;
      G.swapOn = false;
      G.phaseT = 0;
      if (G.swapI >= G.swapList.length) enterPick();
    }
  }

  function updateFx(dt) {
    G.t += dt;
    G.clock += dt;
    G.shake = Math.max(0, G.shake - dt * 28);
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.magFlash = Math.max(0, G.magFlash - dt * 1.8);
    G.goldFlash = Math.max(0, G.goldFlash - dt * 1.5);
    G.lock = Math.max(0, G.lock - dt);
    G.bannerA = Math.max(0, G.bannerA - dt * 0.85);
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) toastEl.classList.add('hidden');
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.98;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function updateTitle(dt) {
    G.phase = 'watch';
    G.phaseT += dt;
    updateDoors(dt);
    if (G.phaseT > G.watchEnd + 1.35) {
      buildBoard(STAGES[0], true);
      G.phase = 'watch';
      G.phaseT = 0;
    }
  }

  function updatePlay(dt) {
    updateDoors(dt);
    if (G.phase === 'intro') {
      G.phaseT += dt;
      if (G.phaseT > 0.62) {
        G.phase = 'watch';
        G.phaseT = 0;
        G.banner = '看';
        G.bannerA = 1;
      }
    } else if (G.phase === 'watch') {
      G.phaseT += dt;
      if (G.phaseT > G.watchEnd) {
        G.phase = 'shut';
        G.phaseT = 0;
        if (G.mode === 'play') {
          audio.slam();
          G.shake = 5;
        }
      }
    } else if (G.phase === 'shut') {
      G.phaseT += dt;
      if (G.phaseT > 0.3) {
        if (G.swapList.length) {
          G.phase = 'swap';
          G.phaseT = 0;
          G.swapI = 0;
          G.swapOn = false;
          G.banner = '换';
          G.bannerA = 1;
          toast('换');
        } else {
          enterPick();
        }
      }
    } else if (G.phase === 'swap') {
      updateSwap(dt);
    } else if (G.phase === 'pick') {
      G.phaseT += dt;
      G.pickLeft -= dt;
      if (G.pickLeft <= 0) failStage('time');
    } else if (G.phase === 'reveal') {
      G.phaseT += dt;
      if (G.phaseT > 0.4 && !G.judged) {
        G.judged = true;
        const d = G.doors[G.revealI];
        if (d) judge(d);
      }
    } else if (G.phase === 'hold') {
      G.phaseT += dt;
      if (G.phaseT > 0.62) clearStage();
    }
  }

  function update(dt) {
    updateFx(dt);
    if (G.mode === 'title') updateTitle(dt);
    else if (G.mode === 'play') updatePlay(dt);
    else if (G.mode === 'clear') {
      updateDoors(dt);
      G.phaseT += dt;
      if (G.phaseT > 0.55) startStage(G.stage + 1);
    } else if (G.mode === 'fail' || G.mode === 'win') {
      updateDoors(dt);
    }
    syncHud();
  }

  function pathArch(x, y, w, h) {
    const r = w * 0.5;
    const cy = y + r;
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, cy);
    ctx.arc(x + r, cy, r, Math.PI, 0);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
  }

  function drawKey(x, y, s, rgb, glow, broken) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    if (glow) {
      const g = ctx.createRadialGradient(0, -8, 1, 0, -4, 26);
      g.addColorStop(0, 'rgba(' + rgb + ',0.55)');
      g.addColorStop(1, 'rgba(' + rgb + ',0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, -6, 26, 0, TAU);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgb(' + rgb + ')';
    ctx.fillStyle = 'rgb(' + rgb + ')';
    ctx.lineWidth = 2.3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (broken) {
      ctx.arc(0, -9, 6.2, 0.4, TAU - 0.9);
    } else {
      ctx.arc(0, -9, 6.2, 0, TAU);
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -9, 2.3, 0, TAU);
    ctx.fill();
    ctx.fillRect(-1.25, -3, 2.5, 17);
    if (broken) {
      ctx.fillRect(-6.4, 8, 5.2, 2.1);
      ctx.fillRect(-5.2, 12.2, 3.2, 2.1);
    } else {
      ctx.fillRect(1.2, 8, 5.4, 2.2);
      ctx.fillRect(1.2, 12.4, 3.6, 2.2);
    }
    ctx.restore();
  }

  function drawHook(x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.strokeStyle = 'rgba(0,240,255,0.35)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(0, -8);
    ctx.arc(3, -8, 3, Math.PI, 0.2, true);
    ctx.stroke();
    ctx.restore();
  }

  function drawLightPool(d) {
    if (d.open < 0.05) return;
    const x = d.visX;
    const y = d.visY;
    const w = d.w;
    const h = d.h;
    const gap = d.open * w * 0.7;
    const px = x + w - 8;
    const py = y + h;
    let rgb = '80,90,120';
    let a = 0.08 * d.open;
    if (d.kind === 'key') {
      rgb = '255,227,107';
      a = 0.22 * d.open;
    } else if (d.kind === 'fake') {
      rgb = '255,61,184';
      a = 0.18 * d.open;
    }
    ctx.save();
    ctx.fillStyle = 'rgba(' + rgb + ',' + a + ')';
    ctx.beginPath();
    ctx.moveTo(px - 6, py);
    ctx.lineTo(px + 8, py);
    ctx.lineTo(px + gap * 0.55, py + 70 + d.open * 36);
    ctx.lineTo(px - gap * 0.35, py + 70 + d.open * 36);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawDoor(d, selected) {
    const x = d.visX;
    const y = d.visY - d.lift;
    const w = d.w;
    const h = d.h;
    const open = clamp(d.open, 0, 1);

    ctx.save();
    ctx.beginPath();
    pathArch(x - 5, y - 6, w + 10, h + 8);
    ctx.fillStyle = '#0a0714';
    ctx.fill();
    ctx.lineWidth = 2 * scale / scale;
    ctx.strokeStyle = selected
      ? 'rgba(0,240,255,0.95)'
      : 'rgba(0,240,255,0.55)';
    ctx.stroke();
    if (selected) {
      ctx.strokeStyle = 'rgba(255,61,184,0.35)';
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.lineWidth = 2;
    }

    ctx.save();
    ctx.beginPath();
    pathArch(x + 4, y + 4, w - 8, h - 6);
    ctx.clip();
    const ig = ctx.createLinearGradient(x, y, x + w, y + h);
    if (d.kind === 'key' && open > 0.04) {
      ig.addColorStop(0, '#1a1020');
      ig.addColorStop(0.55, '#2a1a14');
      ig.addColorStop(1, '#1c140c');
    } else if (d.kind === 'fake' && open > 0.04) {
      ig.addColorStop(0, '#1a0a18');
      ig.addColorStop(0.6, '#2a1022');
      ig.addColorStop(1, '#140814');
    } else {
      ig.addColorStop(0, '#0c0814');
      ig.addColorStop(1, '#080610');
    }
    ctx.fillStyle = ig;
    ctx.fillRect(x, y, w, h);

    const bias = G.spec.bias == null ? 0.55 : G.spec.bias;
    const peakNow = G.spec.peak || 0.5;
    const peekScale = Math.max(0.08, 1 - peakNow * 0.9);
    const inPad = Math.max(5, w * 0.07);
    const inW = w - inPad * 2;
    const crackL = x + inPad + inW * peekScale + 8;
    const crackR = x + w - 12;
    const ix = lerp(crackL, crackR, clamp(bias, 0.14, 0.9));
    const iy = y + h * 0.4;
    const ks = w / 92;
    if (d.kind === 'key' && !d.collected) {
      drawHook(ix, iy - 10, ks);
      drawKey(ix, iy, ks, '255,227,107', true, false);
    } else if (d.kind === 'key' && d.collected) {
      drawHook(ix, iy - 10, ks);
    } else if (d.kind === 'fake') {
      drawHook(ix, iy - 10, ks);
      drawKey(ix, iy, ks, '255,61,184', true, true);
    } else {
      drawHook(ix, iy - 10, ks);
      ctx.strokeStyle = 'rgba(139,144,184,0.16)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.2, y + h * 0.22);
      ctx.quadraticCurveTo(x + w * 0.45, y + h * 0.3, x + w * 0.38, y + h * 0.48);
      ctx.stroke();
    }
    ctx.restore();

    const inset = Math.max(5, w * 0.07);
    const px = x + inset;
    const py = y + inset;
    const pw = w - inset * 2;
    const ph = h - inset;
    const sxScale = Math.max(0.08, 1 - open * 0.9);

    ctx.save();
    ctx.translate(px, 0);
    ctx.scale(sxScale, 1);
    ctx.translate(-px, 0);
    ctx.beginPath();
    pathArch(px, py, pw, ph);
    const pg = ctx.createLinearGradient(px, py, px + pw, py);
    pg.addColorStop(0, '#1a1228');
    pg.addColorStop(0.45, '#241833');
    pg.addColorStop(1, '#140e22');
    ctx.fillStyle = pg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,61,184,0.28)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0,240,255,0.12)';
    ctx.lineWidth = 1;
    for (let g = 1; g <= 3; g++) {
      const gx = px + pw * (0.22 * g);
      ctx.beginPath();
      ctx.moveTo(gx, py + pw * 0.45);
      ctx.lineTo(gx, py + ph - 10);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,61,184,0.18)';
    ctx.fillRect(px + 6, py + ph - 18, pw - 12, 8);

    const hx = px + pw * 0.82;
    const hy = py + ph * 0.52;
    ctx.beginPath();
    ctx.arc(hx, hy, Math.max(3.2, w * 0.045), 0, TAU);
    ctx.fillStyle = '#ff3db8';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,180,230,0.7)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    if (open > 0.03) {
      const edgeX = px + pw * sxScale;
      ctx.strokeStyle = d.kind === 'key'
        ? 'rgba(255,227,107,' + (0.35 + open * 0.5) + ')'
        : d.kind === 'fake'
          ? 'rgba(255,61,184,' + (0.3 + open * 0.4) + ')'
          : 'rgba(0,240,255,0.28)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(edgeX, y + w * 0.42);
      ctx.lineTo(edgeX, y + h - 4);
      ctx.stroke();
    }

    const lx = x + w * 0.5;
    const ly = y - 16;
    const glow = 0.35 + open * 0.65;
    let lamp = '0,240,255';
    if (d.open > 0.1 && d.kind === 'key') lamp = '255,227,107';
    else if (d.open > 0.1 && d.kind === 'fake') lamp = '255,61,184';
    ctx.beginPath();
    ctx.arc(lx, ly, 10, 0, TAU);
    ctx.fillStyle = 'rgba(' + lamp + ',0.12)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(lx, ly, 4.5, 0, TAU);
    ctx.fillStyle = 'rgba(' + lamp + ',' + glow + ')';
    ctx.fill();

    ctx.fillStyle = selected ? '#00f0ff' : 'rgba(200,210,240,0.78)';
    ctx.font = '600 ' + Math.max(11, w * 0.13) + 'px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(d.slot + 1), x + w * 0.5, y + h - 16);

    if (d.collected) {
      ctx.fillStyle = 'rgba(255,227,107,0.9)';
      ctx.font = '700 11px "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillText('钥', x + w * 0.5, y + h * 0.78);
    }
    ctx.restore();
  }

  function drawHall() {
    const g = ctx.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, '#0b0716');
    g.addColorStop(0.42, '#080512');
    g.addColorStop(1, '#05030c');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, VH);

    const vpX = VW * 0.5;
    const vpY = 168;
    ctx.fillStyle = 'rgba(0,240,255,0.05)';
    ctx.beginPath();
    ctx.moveTo(vpX - 36, vpY + 8);
    ctx.lineTo(vpX + 36, vpY + 8);
    ctx.lineTo(VW + 20, VH);
    ctx.lineTo(-20, VH);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(0,240,255,0.07)';
    ctx.lineWidth = 1;
    for (let i = -4; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo(vpX + i * 7, vpY + 10);
      ctx.lineTo(vpX + i * 70, VH);
      ctx.stroke();
    }
    for (let k = 1; k <= 6; k++) {
      const t = k / 7;
      const y = lerp(vpY + 24, VH - 8, t * t);
      const half = lerp(28, VW * 0.62, t * t);
      ctx.beginPath();
      ctx.moveTo(vpX - half, y);
      ctx.lineTo(vpX + half, y);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(255,61,184,0.5)';
    ctx.beginPath();
    ctx.arc(vpX, vpY - 6, 3.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,240,255,0.45)';
    ctx.beginPath();
    ctx.arc(vpX, vpY - 6, 7, 0, TAU);
    ctx.fillStyle = 'rgba(0,240,255,0.08)';
    ctx.fill();

    const wallY = G.slots.length ? G.slots[0].y - 36 : 210;
    ctx.fillStyle = 'rgba(12, 10, 24, 0.55)';
    ctx.fillRect(18, wallY, VW - 36, 16);
    ctx.strokeStyle = 'rgba(0,240,255,0.2)';
    ctx.beginPath();
    ctx.moveTo(28, wallY + 16);
    ctx.lineTo(VW - 28, wallY + 16);
    ctx.stroke();
  }

  function drawMotes() {
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const a = m.a * (0.55 + 0.45 * Math.sin(G.t * 0.7 + m.p));
      ctx.fillStyle = i % 3 === 0
        ? 'rgba(255,61,184,' + a + ')'
        : 'rgba(0,240,255,' + a + ')';
      ctx.beginPath();
      ctx.arc(m.x, m.y + Math.sin(G.t * 0.4 + m.p) * m.s * 0.15, m.r, 0, TAU);
      ctx.fill();
    }
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.gold ? '#ffe36b' : p.mag ? '#ff3db8' : '#00f0ff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawBanner() {
    if (G.bannerA <= 0.02) return;
    ctx.save();
    ctx.globalAlpha = clamp(G.bannerA, 0, 0.55);
    ctx.fillStyle = '#f6f3ff';
    ctx.font = '900 64px "Segoe UI", "PingFang SC", "Noto Sans SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(G.banner, VW * 0.5, 92);
    ctx.restore();
  }

  function drawCursor(slot) {
    const sl = G.slots[slot];
    if (!sl) return;
    const d = doorAtSlot(slot);
    const x = d ? d.visX + d.w * 0.5 : sl.x + sl.w * 0.5;
    const y = (d ? d.visY + d.h : sl.y + sl.h) + 26;
    const pulse = 0.6 + 0.4 * Math.sin(G.t * 6);
    ctx.fillStyle = 'rgba(0,240,255,' + (0.35 + 0.35 * pulse) + ')';
    ctx.beginPath();
    ctx.moveTo(x, y - 8);
    ctx.lineTo(x - 8, y + 4);
    ctx.lineTo(x + 8, y + 4);
    ctx.closePath();
    ctx.fill();
  }

  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#05030c';
    ctx.fillRect(0, 0, W, H);

    const shx = G.shake ? rand(-G.shake, G.shake) * scale * 0.15 : 0;
    const shy = G.shake ? rand(-G.shake, G.shake) * scale * 0.12 : 0;
    ctx.setTransform(scale, 0, 0, scale, ox + shx, oy + shy);

    drawHall();
    drawMotes();

    const order = [];
    for (let i = 0; i < G.doors.length; i++) order.push(i);
    order.sort(function (a, b) {
      return G.doors[a].lift - G.doors[b].lift;
    });
    for (let i = 0; i < order.length; i++) drawLightPool(G.doors[order[i]]);
    for (let i = 0; i < order.length; i++) {
      const d = G.doors[order[i]];
      const sel = G.mode === 'play' && (G.phase === 'pick' || G.phase === 'reveal') && d.slot === G.cursor;
      drawDoor(d, sel);
    }
    if (G.mode === 'play' && (G.phase === 'pick' || G.phase === 'reveal')) {
      drawCursor(G.cursor);
    }
    drawParticles();
    drawBanner();

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (G.goldFlash > 0) {
      ctx.fillStyle = 'rgba(255,227,107,' + (G.goldFlash * 0.14) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    if (G.magFlash > 0) {
      ctx.fillStyle = 'rgba(255,61,184,' + (G.magFlash * 0.16) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    const vg = ctx.createRadialGradient(W * 0.5, H * 0.45, H * 0.2, W * 0.5, H * 0.5, H * 0.78);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(5,3,12,0.5)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
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

  function onKey(e) {
    const code = e.code;
    if (code === 'KeyM') {
      e.preventDefault();
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (code === 'KeyR') {
      e.preventDefault();
      audio.ensure();
      startRun();
      return;
    }
    if (overlayOpen()) {
      if (code === 'Enter' || code === 'Space') {
        e.preventDefault();
        overlayAction();
      }
      return;
    }
    if (G.mode !== 'play') return;
    if (code === 'ArrowLeft' || code === 'KeyA') {
      e.preventDefault();
      G.cursor = nav(G.cursor, 'l');
      return;
    }
    if (code === 'ArrowRight' || code === 'KeyD') {
      e.preventDefault();
      G.cursor = nav(G.cursor, 'r');
      return;
    }
    if (code === 'ArrowUp' || code === 'KeyW') {
      e.preventDefault();
      G.cursor = nav(G.cursor, 'u');
      return;
    }
    if (code === 'ArrowDown' || code === 'KeyS') {
      e.preventDefault();
      G.cursor = nav(G.cursor, 'd');
      return;
    }
    if (code === 'Space' || code === 'Enter') {
      e.preventDefault();
      tryPick(G.cursor);
      return;
    }
    const digit = e.key;
    if (digit >= '1' && digit <= '6') {
      e.preventDefault();
      tryPick(parseInt(digit, 10) - 1);
    }
  }

  function onPtrDown(e) {
    if (overlayOpen()) return;
    e.preventDefault();
    audio.ensure();
    pointer.down = true;
    pointer.id = e.pointerId;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (err) { /* ignore */ }
    const w = worldFromEvent(e);
    pointer.x = w.x;
    pointer.y = w.y;
    const slot = hitSlot(w.x, w.y);
    if (slot >= 0) {
      G.cursor = slot;
      tryPick(slot);
    }
  }

  function onPtrMove(e) {
    const w = worldFromEvent(e);
    pointer.x = w.x;
    pointer.y = w.y;
    if (G.mode === 'play' && G.phase === 'pick') {
      const slot = hitSlot(w.x, w.y);
      if (slot >= 0) G.cursor = slot;
    }
  }

  function onPtrUp(e) {
    pointer.down = false;
    pointer.id = null;
    try {
      if (e && e.pointerId != null) canvas.releasePointerCapture(e.pointerId);
    } catch (err) { /* ignore */ }
  }

  ovBtn.addEventListener('click', function () {
    overlayAction();
  });
  btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  btnRetry.addEventListener('click', function () {
    audio.ensure();
    startRun();
  });
  window.addEventListener('keydown', onKey);
  canvas.addEventListener('pointerdown', onPtrDown, { passive: false });
  canvas.addEventListener('pointermove', onPtrMove);
  canvas.addEventListener('pointerup', onPtrUp);
  canvas.addEventListener('pointercancel', onPtrUp);
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
  });

  seedMotes();
  resize();
  bootTitle();
  syncHud();

  let acc = 0;
  let last = 0;
  function frame(ts) {
    if (!last) last = ts;
    let dt = (ts - last) / 1000;
    last = ts;
    if (dt > 0.08) dt = 0.08;
    if (!hidden) {
      acc += dt;
      while (acc >= STEP) {
        update(STEP);
        acc -= STEP;
      }
    }
    draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
