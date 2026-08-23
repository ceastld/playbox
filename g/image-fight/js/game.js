'use strict';

(function () {
  const VW = 800;
  const VH = 450;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 16000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.32;
  const HIT_R = 6.2;
  const POD_R = 11;
  const BEST_KEY = 'playbox-image-fight-best';
  const MUTE_KEY = 'playbox-image-fight-mute';
  const OPS = '←↑↓→ / WASD 飞 · 空格射击 · Shift / Z 抛核 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const VIO = [138, 107, 255];
  const CYN = [122, 232, 255];
  const MAG = [196, 90, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 90, 122];
  const RINGC = [200, 255, 106];
  const WHT = [239, 234, 255];
  const PNK = [255, 154, 212];
  const DEEP = [18, 14, 48];
  const RED = [255, 72, 110];

  const PODS = [
    { name: '红散', tag: 'spread', rgb: HOT, cd: 0.108, dmg: 1.05 },
    { name: '蓝束', tag: 'beam', rgb: CYN, cd: 0.064, dmg: 0.82 },
    { name: '环刃', tag: 'ring', rgb: RINGC, cd: 0.20, dmg: 1.35 }
  ];

  const SCORE = {
    dart: 50,
    wing: 70,
    turret: 90,
    ring: 80,
    prism: 160,
    ghost: 40,
    boss: [2500, 4200, 7000],
    clear: 1600,
    all: 4000
  };

  const STAGES = [
    {
      name: '镜廊',
      boss: '镜心',
      theme: 'mirror',
      bossHp: 76,
      waves: [
        { t: 0.6, kind: 'v', n: 5 },
        { t: 3.2, kind: 'wing', n: 2 },
        { t: 5.6, kind: 'turret', n: 2 },
        { t: 7.8, kind: 'ring', n: 2 },
        { t: 10.4, kind: 'v', n: 7 },
        { t: 13.0, kind: 'prism' },
        { t: 15.6, kind: 'wing', n: 3 },
        { t: 18.2, kind: 'mix' },
        { t: 21.0, kind: 'v', n: 6 },
        { t: 23.6, kind: 'boss' }
      ]
    },
    {
      name: '晶轨',
      boss: '轨核',
      theme: 'rail',
      bossHp: 98,
      waves: [
        { t: 0.5, kind: 'v', n: 6 },
        { t: 2.8, kind: 'turret', n: 3 },
        { t: 5.2, kind: 'ring', n: 3 },
        { t: 7.6, kind: 'wing', n: 3 },
        { t: 10.2, kind: 'prism' },
        { t: 12.8, kind: 'v', n: 8 },
        { t: 15.4, kind: 'mix' },
        { t: 18.0, kind: 'turret', n: 2 },
        { t: 20.4, kind: 'ring', n: 2 },
        { t: 23.8, kind: 'boss' }
      ]
    },
    {
      name: '残塔',
      boss: '残像主脑',
      theme: 'echo',
      bossHp: 128,
      waves: [
        { t: 0.4, kind: 'v', n: 7 },
        { t: 2.6, kind: 'ghost', n: 4 },
        { t: 5.0, kind: 'wing', n: 4 },
        { t: 7.4, kind: 'ring', n: 3 },
        { t: 10.0, kind: 'prism' },
        { t: 12.4, kind: 'mix' },
        { t: 15.0, kind: 'ghost', n: 5 },
        { t: 17.4, kind: 'v', n: 8 },
        { t: 19.8, kind: 'turret', n: 3 },
        { t: 22.4, kind: 'prism' },
        { t: 25.2, kind: 'boss' }
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
  const ovStart = document.getElementById('ov-start');
  const ovEnd = document.getElementById('ov-end');
  const btnFight = document.getElementById('btn-fight');
  const btnEcho = document.getElementById('btn-echo');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnPod = document.getElementById('btn-pod');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const podLabel = document.getElementById('pod-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');

  let W = 1;
  let H = 1;
  let dpr = 1;
  let scale = 1;
  let ox = 0;
  let oy = 0;
  let hidden = false;
  let addTok = 0;
  let toastTok = 0;
  let kickTok = 0;
  let comboTok = 0;
  let podTok = 0;
  let uid = 1;
  let inputSrc = 'key';

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, hover: false, x: 90, y: VH * 0.5, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const stars = [];
  const ghosts = [];
  const decos = [];

  const G = {
    mode: 'title',
    kind: 'fight',
    t: 0,
    clock: 0,
    cam: 0,
    px: 90,
    py: VH * 0.5,
    vx: 0,
    vy: 0,
    bank: 0,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    stage: 1,
    nextLife: LIFE_EVERY,
    ents: [],
    shots: [],
    eShots: [],
    drops: [],
    fireHold: false,
    fireCd: 0,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: VIO,
    punch: 1,
    muzzle: 0,
    toastT: 0,
    why: '',
    boss: false,
    winT: 0,
    waveI: 0,
    aim: 0,
    podCd: 0,
    ramT: 0,
    pod: {
      have: true,
      type: 0,
      state: 'dock',
      sx: 118,
      sy: VH * 0.5,
      vx: 0,
      vy: 0,
      aim: 0,
      fireCd: 0,
      spin: 0,
      glow: 0
    }
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
  function mix(a, b, t) {
    return [
      (a[0] + (b[0] - a[0]) * t) | 0,
      (a[1] + (b[1] - a[1]) * t) | 0,
      (a[2] + (b[2] - a[2]) * t) | 0
    ];
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
  function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function isEcho() {
    return G.kind === 'echo';
  }
  function stageDef() {
    return STAGES[clamp(G.stage - 1, 0, STAGES.length - 1)];
  }
  function podDef() {
    return PODS[clamp(G.pod.type, 0, PODS.length - 1)];
  }
  function comboMult() {
    return 1 + Math.min(4, Math.floor(Math.max(0, G.combo - 1) / 3));
  }
  function moveSpd() {
    return isEcho() ? 322 : 282;
  }
  function scrollSpd() {
    if (G.boss) {
      const b = findBoss();
      if (b && b.alive) {
        const x = b.x - G.cam;
        if (x < VW - 210) return isEcho() ? 10 : 6;
        if (x < VW - 130) return isEcho() ? 36 : 22;
      }
      return isEcho() ? 48 : 32;
    }
    return isEcho() ? 168 : 112;
  }
  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }
  function playing() {
    return G.mode === 'play';
  }
  function nextId() {
    uid += 1;
    return uid;
  }
  function eightWay(dx, dy) {
    if (dx === 0 && dy === 0) return G.aim;
    const ang = Math.atan2(dy, dx);
    return Math.round(ang / (Math.PI / 4)) * (Math.PI / 4);
  }
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function findBoss() {
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].kind === 'boss' && G.ents[i].alive) return G.ents[i];
    }
    return null;
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
        localStorage.setItem(MUTE_KEY, m ? '1' : '0');
      } catch (err) { /* ignore */ }
    },
    beep(freq, dur, type, vol, slide) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || 'square';
      o.frequency.setValueAtTime(Math.max(40, freq), t);
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
      const buf = this.ctx.createBuffer(1, Math.max(1, (sr * n) | 0), sr);
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
    shoot() {
      this.ensure();
      this.beep(920, 0.045, 'square', 0.028, 1840);
    },
    podShot(type) {
      this.ensure();
      if (type === 1) this.beep(1240, 0.05, 'sawtooth', 0.03, 420);
      else if (type === 2) {
        this.beep(660, 0.07, 'triangle', 0.034, 1320);
        this.beep(990, 0.05, 'square', 0.02, 440);
      } else this.beep(540, 0.05, 'square', 0.03, 1080);
    },
    launch() {
      this.ensure();
      this.beep(260, 0.1, 'sawtooth', 0.046, 780);
      this.beep(880, 0.12, 'triangle', 0.03, 220);
      this.noise(0.07, 0.032, 700);
    },
    lock() {
      this.ensure();
      this.beep(440, 0.07, 'square', 0.036, 220);
      this.beep(880, 0.1, 'sine', 0.03, 1760);
    },
    recall() {
      this.ensure();
      this.beep(990, 0.08, 'sine', 0.034, 330);
    },
    dock() {
      this.ensure();
      this.beep(720, 0.06, 'square', 0.038, 240);
      this.beep(360, 0.1, 'triangle', 0.032, 160);
    },
    pick() {
      this.ensure();
      this.beep(523, 0.07, 'square', 0.042, 784);
      this.beep(784, 0.12, 'triangle', 0.038, 1175);
    },
    ram() {
      this.ensure();
      this.noise(0.05, 0.038, 420);
      this.beep(210, 0.07, 'sawtooth', 0.036, 90);
    },
    hit(kind, combo) {
      this.ensure();
      const base = kind === 'boss' ? 200 : kind === 'prism' ? 320 : 480;
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.04, 0.034, 1100);
      this.beep(base * lift, 0.075, 'square', 0.044, base * lift * 1.5);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    death() {
      this.ensure();
      this.noise(0.18, 0.065, 280);
      this.beep(280, 0.22, 'sawtooth', 0.052, 64);
      this.beep(140, 0.34, 'sine', 0.045, 40);
    },
    up() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.045, 784);
      this.beep(784, 0.12, 'triangle', 0.04, 1046);
    },
    win() {
      this.ensure();
      this.beep(523, 0.12, 'square', 0.05, 784);
      this.beep(784, 0.16, 'triangle', 0.045, 1046);
      this.beep(1046, 0.28, 'sine', 0.04, 1568);
    },
    lose() {
      this.ensure();
      this.beep(220, 0.18, 'sawtooth', 0.04, 90);
      this.beep(140, 0.3, 'sine', 0.05, 48);
    },
    start() {
      this.ensure();
      this.beep(392, 0.09, 'square', 0.04, 784);
      this.beep(784, 0.14, 'triangle', 0.035, 1175);
    },
    warn() {
      this.ensure();
      this.beep(220, 0.16, 'square', 0.04, 110);
      this.beep(330, 0.22, 'sawtooth', 0.035, 80);
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
    if ((G.mode !== 'play' && G.mode !== 'win') || n <= 0) return;
    G.score += n;
    if (scoreEl) scoreEl.textContent = String(G.score);
    saveBest();
    while (G.score >= G.nextLife) {
      G.nextLife += LIFE_EVERY;
      if (G.lives < LIFE_CAP) {
        G.lives += 1;
        toast('1UP', false, true);
        audio.up();
        syncPips();
      }
    }
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

  function syncPips() {
    if (!pipsEl) return;
    while (pips.length < G.lives) {
      const el = document.createElement('i');
      el.className = 'pip on';
      pipsEl.appendChild(el);
      pips.push(el);
    }
    while (pips.length > Math.max(G.lives, LIVES)) {
      const el = pips.pop();
      if (el && el.parentNode) el.parentNode.removeChild(el);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].className = 'pip' + (i < G.lives ? ' on' : ' gone');
    }
  }

  function setHint(text, cls) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.className = 'hint' + (cls ? ' ' + cls : '');
  }

  function toast(msg, warn, gold) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.className = 'toast' + (warn ? ' warn' : gold ? ' gold' : '');
    toastTok += 1;
    const tok = toastTok;
    G.toastT = 1.05;
    setTimeout(function () {
      if (tok === toastTok) toastEl.classList.add('hidden');
    }, 980);
  }

  function popPodBadge() {
    if (!podLabel) return;
    podLabel.classList.remove('pop');
    void podLabel.offsetWidth;
    podLabel.classList.add('pop');
    podTok += 1;
    const tok = podTok;
    setTimeout(function () {
      if (tok === podTok) podLabel.classList.remove('pop');
    }, 280);
  }

  function hud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      const info = stageDef();
      stageLabel.textContent = G.boss ? info.boss : info.name;
      stageLabel.classList.toggle('hot', G.boss);
    }
    if (tagLabel) {
      tagLabel.textContent = isEcho() ? '残像' : '幻击';
      tagLabel.className = isEcho() ? 'warn' : '';
    }
    if (podLabel) {
      if (!G.pod.have) {
        podLabel.textContent = '无核';
        podLabel.className = 'pod-badge off';
      } else {
        const p = podDef();
        const st = G.pod.state === 'lock' ? '锚核' : G.pod.state === 'fly' || G.pod.state === 'back' ? '抛核' : '装核';
        podLabel.textContent = p.name + ' · ' + st;
        podLabel.className = 'pod-badge ' + p.tag + (G.pod.state === 'lock' ? ' lock' : G.pod.state === 'dock' ? ' dock' : ' fly');
      }
    }
    if (comboEl) {
      if (G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = G.mult > 1 ? ('连击 ' + G.combo + ' ×' + G.mult) : ('连击 ' + G.combo);
      } else comboEl.hidden = true;
    }
    if (G.mode === 'title') setHint('飞向捡幻核 · 八向决定炮口 · Shift 抛成炮台', '');
    else if (G.mode === 'lose') setHint('R 重开 · 八向甩核，抛出去当炮台', 'warn');
    else if (G.mode === 'win') setHint('R 重开 · 残像主脑已碎', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 把核抛到弹路上挡射', 'warn');
    else if (!G.pod.have) setHint('核丢了 · 捡红散 / 蓝束 / 环刃', 'warn');
    else if (G.pod.state === 'lock') setHint('幻核锚住了 · 再按 Shift 收回', '');
    else if (G.pod.state === 'fly' || G.pod.state === 'back') setHint('幻核在飞 · 锚住当炮台，收回贴机', '');
    else setHint('空格正射 · 方向决定核口 · Shift 抛核', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'IMFG';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    const ended = kind === 'lose' || kind === 'win';
    if (ovStart) ovStart.classList.toggle('gone', ended);
    if (ovEnd) ovEnd.classList.toggle('gone', !ended);
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (canvas && canvas.focus) canvas.focus();
  }

  function hitStop(sec) {
    if (REDUCE || G.mode !== 'play') return;
    G.stop = Math.max(G.stop, sec);
  }

  function kick(mag) {
    if (REDUCE || (G.mode !== 'play' && G.mode !== 'win')) return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.045, mag * 0.006));
    if (!stageEl) return;
    kickTok += 1;
    const cls = mag >= 6 ? 'die' : mag >= 3.4 ? 'morph' : mag >= 2.2 ? 'charge' : 'hit';
    stageEl.classList.remove('die', 'hit', 'morph', 'charge');
    void stageEl.offsetWidth;
    stageEl.classList.add(cls);
  }

  function screenFlash(rgb, a) {
    G.flash = Math.max(G.flash, a || 0.4);
    G.flashRgb = rgb;
  }

  function capArr(arr, n) {
    if (arr.length > n) arr.splice(0, arr.length - n);
  }

  function emit(n, spec) {
    const count = REDUCE ? Math.ceil(n * 0.4) : n;
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
        g: spec.g == null ? 280 : spec.g
      });
    }
    capArr(particles, 300);
  }

  function burst(x, y, n, rgb, mag) {
    emit(n, {
      x: x, y: y, j: mag * 0.25,
      vx0: -mag * 2.2, vx1: mag * 2.2,
      vy0: -mag * 2.2, vy1: mag * 2.2,
      r0: 1.4, r1: 3.8, life: 0.42, rgb: rgb
    });
    sparks.push({ x: x, y: y, t: 0, rgb: rgb, rad: mag * 0.7 });
    rings.push({ x: x, y: y, t: 0, rgb: rgb, r: mag * 0.55 });
    capArr(sparks, 36);
    capArr(rings, 28);
  }

  function floatText(x, y, text, rgb) {
    floats.push({ x: x, y: y, text: text, rgb: rgb || GOLD, t: 0, life: 0.72 });
    capArr(floats, 18);
  }

  function clearField() {
    G.ents.length = 0;
    G.shots.length = 0;
    G.eShots.length = 0;
    G.drops.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    ghosts.length = 0;
    G.waveI = 0;
    G.boss = false;
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 72; i++) {
      stars.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        z: 0.25 + Math.random() * 0.9,
        s: 0.6 + Math.random() * 1.8,
        tw: Math.random() * TAU
      });
    }
  }

  function seedDecos() {
    decos.length = 0;
    for (let i = 0; i < 14; i++) {
      decos.push({
        x: i * 140 + rand(0, 80),
        y: hash2(i * 17 + 3) > 0.5 ? rand(18, 90) : rand(VH - 90, VH - 18),
        w: 28 + hash2(i * 9) * 70,
        h: 12 + hash2(i * 5 + 2) * 36,
        kind: (i % 3),
        top: hash2(i * 17 + 3) > 0.5
      });
    }
  }

  function pushEnt(e) {
    e.id = nextId();
    e.alive = true;
    e.flash = 0;
    e.ph = e.ph || 0;
    e.fireCd = e.fireCd == null ? rand(0.2, 0.8) : e.fireCd;
    G.ents.push(e);
  }

  function spawnDart(x, y, ph) {
    pushEnt({
      kind: 'dart', x: x, y: y, hp: 1, r: 10, score: SCORE.dart,
      vx: isEcho() ? -70 : -54, vy: 0, ph: ph || 0
    });
  }
  function spawnWing(x, y) {
    pushEnt({
      kind: 'wing', x: x, y: y, hp: 3, r: 13, score: SCORE.wing,
      vx: isEcho() ? -42 : -32, vy: 0
    });
  }
  function spawnTurret(x, y) {
    pushEnt({
      kind: 'turret', x: x, y: y, hp: 4, r: 14, score: SCORE.turret,
      vx: 0, vy: 0
    });
  }
  function spawnRing(x, y) {
    pushEnt({
      kind: 'ring', x: x, y: y, hp: 3, r: 14, score: SCORE.ring,
      vx: isEcho() ? -36 : -26, vy: 0, spin: 0
    });
  }
  function spawnPrism(x, y) {
    pushEnt({
      kind: 'prism', x: x, y: y, hp: 10, r: 20, score: SCORE.prism,
      vx: isEcho() ? -28 : -20, vy: 0, drop: true
    });
  }
  function spawnGhost(x, y) {
    pushEnt({
      kind: 'ghost', x: x, y: y, hp: 2, r: 11, score: SCORE.ghost,
      vx: isEcho() ? -80 : -62, vy: 0, fade: 1, echo: true
    });
  }
  function spawnBoss() {
    const st = stageDef();
    const hp = Math.round(st.bossHp * (isEcho() ? 1.28 : 1));
    pushEnt({
      kind: 'boss',
      x: G.cam + VW + 80,
      y: VH * 0.5,
      hp: hp,
      max: hp,
      r: 36,
      score: SCORE.boss[clamp(G.stage - 1, 0, 2)],
      vx: -46,
      vy: 0,
      ph: 0,
      pat: 0,
      fireCd: 0.6,
      drop: true,
      name: st.boss
    });
    G.boss = true;
    toast(st.boss + ' 入镜', true, false);
    audio.warn();
    hud();
  }

  function spawnWave(w) {
    const baseX = G.cam + VW + 36;
    const n = (w.n || 1) + (isEcho() && w.kind !== 'boss' && w.kind !== 'prism' ? 2 : 0);
    if (w.kind === 'v') {
      for (let i = 0; i < n; i++) {
        const k = i - (n - 1) * 0.5;
        spawnDart(baseX + Math.abs(k) * 18, VH * 0.5 + k * 36, i * 0.2);
      }
    } else if (w.kind === 'wing') {
      for (let i = 0; i < n; i++) spawnWing(baseX + i * 28, 90 + i * ((VH - 180) / Math.max(1, n - 1)));
    } else if (w.kind === 'turret') {
      for (let i = 0; i < n; i++) {
        const top = i % 2 === 0;
        spawnTurret(baseX + i * 50, top ? 48 : VH - 48);
      }
    } else if (w.kind === 'ring') {
      for (let i = 0; i < n; i++) spawnRing(baseX + i * 40, 110 + (i % 3) * 110);
    } else if (w.kind === 'prism') {
      spawnPrism(baseX + 20, VH * 0.5 + rand(-40, 40));
    } else if (w.kind === 'ghost') {
      for (let i = 0; i < n; i++) spawnGhost(baseX + i * 22, 80 + (i * 67) % (VH - 160));
    } else if (w.kind === 'mix') {
      spawnPrism(baseX, VH * 0.42);
      spawnWing(baseX + 40, 80);
      spawnWing(baseX + 40, VH - 80);
      spawnDart(baseX + 70, VH * 0.5, 0);
      if (isEcho()) spawnGhost(baseX + 90, VH * 0.3);
    } else if (w.kind === 'boss') {
      spawnBoss();
    }
  }

  function maybeSpawn() {
    const waves = stageDef().waves;
    while (G.waveI < waves.length && G.clock >= waves[G.waveI].t) {
      spawnWave(waves[G.waveI]);
      G.waveI += 1;
    }
  }

  function noteCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const prev = G.mult;
    G.mult = comboMult();
    if (G.mult > prev) {
      audio.combo(G.mult);
      if (comboEl) {
        comboEl.classList.remove('hot');
        void comboEl.offsetWidth;
        comboEl.classList.add('hot');
        comboTok += 1;
        const tok = comboTok;
        setTimeout(function () {
          if (tok === comboTok && comboEl) comboEl.classList.remove('hot');
        }, 280);
      }
      floatText(G.px + 20, G.py - 18, '×' + G.mult, GOLD);
    }
    hud();
  }

  function dropPod(x, y, type) {
    G.drops.push({
      x: x,
      y: y,
      vx: -20,
      vy: rand(-18, 18),
      type: type == null ? ((Math.random() * 3) | 0) : type,
      t: 0,
      life: 12
    });
    capArr(G.drops, 8);
  }

  function collectDrop(d) {
    G.pod.have = true;
    G.pod.type = d.type;
    if (G.pod.state === 'dock') {
      G.pod.sx = G.px + Math.cos(G.aim) * 28;
      G.pod.sy = G.py + Math.sin(G.aim) * 28;
    } else {
      G.pod.state = 'dock';
    }
    G.pod.glow = 1;
    burst(d.x - G.cam, d.y, 10, podDef().rgb, 18);
    floatText(d.x - G.cam, d.y - 10, podDef().name, podDef().rgb);
    toast(podDef().name + ' 装上', false, true);
    audio.pick();
    hitStop(0.05);
    kick(2.1);
    popPodBadge();
    hud();
  }

  function togglePod() {
    if (!playing() || G.deadT > 0 || G.podCd > 0) return;
    if (!G.pod.have) {
      toast('没有幻核', true, false);
      return;
    }
    G.podCd = 0.18;
    if (G.pod.state === 'dock') {
      G.pod.state = 'fly';
      G.pod.aim = G.aim;
      G.pod.vx = Math.cos(G.aim) * 440;
      G.pod.vy = Math.sin(G.aim) * 440;
      G.pod.flyT = 0;
      G.pod.glow = 1;
      audio.launch();
      emit(8, {
        x: G.pod.sx, y: G.pod.sy, j: 4,
        vx0: -40, vx1: 40, vy0: -40, vy1: 40,
        r0: 1.2, r1: 2.6, life: 0.28, rgb: podDef().rgb
      });
      kick(1.8);
      popPodBadge();
    } else {
      G.pod.state = 'back';
      audio.recall();
      popPodBadge();
    }
    hud();
  }

  function fireMain() {
    if (G.fireCd > 0 || G.deadT > 0) return;
    G.fireCd = isEcho() ? 0.078 : 0.09;
    G.muzzle = 1;
    const wx = G.cam + G.px + 18;
    G.shots.push({
      x: wx, y: G.py, vx: 660, vy: 0, dmg: 1, kind: 'main',
      r: 3.2, life: 1.1, rgb: WHT, pierce: 0
    });
    audio.shoot();
  }

  function firePod() {
    const p = G.pod;
    if (!p.have || p.fireCd > 0 || G.deadT > 0) return;
    const def = podDef();
    p.fireCd = def.cd * (isEcho() ? 0.92 : 1);
    const ang = p.state === 'dock' ? G.aim : p.aim;
    const wx = G.cam + p.sx;
    const wy = p.sy;
    const rgb = def.rgb;
    if (def.tag === 'spread') {
      for (let i = -1; i <= 1; i++) {
        const a = ang + i * 0.22;
        G.shots.push({
          x: wx + Math.cos(a) * 10, y: wy + Math.sin(a) * 10,
          vx: Math.cos(a) * 560, vy: Math.sin(a) * 560,
          dmg: def.dmg, kind: 'pod', r: 3.4, life: 0.9, rgb: rgb, pierce: 0, eat: true
        });
      }
    } else if (def.tag === 'beam') {
      G.shots.push({
        x: wx + Math.cos(ang) * 8, y: wy + Math.sin(ang) * 8,
        vx: Math.cos(ang) * 820, vy: Math.sin(ang) * 820,
        dmg: def.dmg, kind: 'beam', r: 2.6, life: 0.7, rgb: rgb, pierce: 3, eat: true, hit: {}
      });
    } else {
      const n = p.state === 'lock' ? 8 : 5;
      const span = p.state === 'lock' ? TAU : 1.15;
      const start = p.state === 'lock' ? 0 : ang - span * 0.5;
      for (let i = 0; i < n; i++) {
        const a = start + (i + 0.5) * (span / n);
        G.shots.push({
          x: wx + Math.cos(a) * 8, y: wy + Math.sin(a) * 8,
          vx: Math.cos(a) * 420, vy: Math.sin(a) * 420,
          dmg: def.dmg, kind: 'ring', r: 3.8, life: 0.7, rgb: rgb, pierce: 0, eat: true
        });
      }
    }
    audio.podShot(p.type);
    p.glow = Math.max(p.glow, 0.55);
  }

  function enemyFire(e, aimed, spread, fat) {
    const px = G.cam + G.px;
    const py = G.py;
    let ang;
    if (aimed) ang = Math.atan2(py - e.y, px - e.x);
    else ang = Math.PI;
    const n = spread || 1;
    const spd = fat ? 150 : (isEcho() ? 168 : 142);
    for (let i = 0; i < n; i++) {
      const a = n === 1 ? ang : ang + (i - (n - 1) * 0.5) * 0.22;
      G.eShots.push({
        x: e.x, y: e.y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        r: fat ? 7.2 : 3.4,
        life: 4.2,
        fat: !!fat,
        rgb: fat ? GOLD : MAG
      });
    }
    capArr(G.eShots, 110);
  }

  function ringFire(e) {
    const n = isEcho() ? 6 : 4;
    const spd = isEcho() ? 150 : 128;
    for (let i = 0; i < n; i++) {
      const a = e.spin + i * (TAU / n);
      G.eShots.push({
        x: e.x, y: e.y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        r: 3.2, life: 3.8, fat: false, rgb: VIO
      });
    }
  }

  function hurtEnemy(e, dmg, hx, hy) {
    if (!e.alive) return;
    e.hp -= dmg;
    e.flash = 0.08;
    noteCombo();
    audio.hit(e.kind, G.combo);
    emit(4, {
      x: hx - G.cam, y: hy, j: 3,
      vx0: -50, vx1: 80, vy0: -60, vy1: 60,
      r0: 1, r1: 2.4, life: 0.22, rgb: e.kind === 'boss' ? GOLD : CYN
    });
    const stop = e.kind === 'boss' ? 0.055 : dmg >= 1.2 ? 0.048 : 0.038;
    hitStop(stop);
    kick(e.kind === 'boss' ? 2.6 : 1.5);
    if (e.hp <= 0) killEnemy(e);
  }

  function killEnemy(e) {
    e.alive = false;
    const sxv = e.x - G.cam;
    const rgb = e.kind === 'boss' ? GOLD : e.kind === 'prism' ? MAG : e.kind === 'ghost' ? VIO : CYN;
    burst(sxv, e.y, e.kind === 'boss' ? 28 : 12, rgb, e.kind === 'boss' ? 46 : 22);
    floatText(sxv, e.y - 8, String(e.score * G.mult), GOLD);
    addScore(e.score * G.mult);
    if (e.drop || (e.kind !== 'ghost' && Math.random() < (e.kind === 'prism' ? 0.7 : 0.16))) {
      dropPod(e.x, e.y, (Math.random() * 3) | 0);
    }
    if (e.kind === 'boss') {
      screenFlash(GOLD, 0.55);
      hitStop(0.08);
      kick(7);
      afterBoss();
    } else if (isEcho() && e.kind !== 'ghost' && Math.random() < 0.34) {
      spawnGhost(e.x + 12, e.y);
    }
  }

  function playerHit(why) {
    if (G.invuln > 0 || G.deadT > 0 || !playing()) return;
    G.why = why || '撞机';
    G.deadT = 0.92;
    G.fireHold = false;
    burst(G.px, G.py, 26, MAG, 38);
    screenFlash(MAG, 0.5);
    hitStop(0.078);
    kick(7.2);
    audio.death();
    if (G.pod.have) {
      dropPod(G.cam + G.pod.sx, G.pod.sy, G.pod.type);
      G.pod.have = false;
      G.pod.state = 'dock';
    }
    G.eShots.length = 0;
    hud();
  }

  function finishDeath() {
    G.lives -= 1;
    syncPips();
    if (G.lives <= 0) {
      loseGame();
      return;
    }
    G.deadT = 0;
    G.px = 90;
    G.py = VH * 0.5;
    G.invuln = 1.45;
    G.aim = 0;
    G.pod.sx = G.px + 28;
    G.pod.sy = G.py;
    toast('残机 ' + G.lives, true, false);
    hud();
  }

  function loseGame() {
    G.mode = 'lose';
    saveBest();
    audio.lose();
    showOverlay('lose', '舰毁了', '幻核没护住。R 立刻重开，或换模式。');
    hud();
  }

  function winGame() {
    G.mode = 'win';
    addScore(SCORE.all);
    saveBest();
    audio.win();
    screenFlash(GOLD, 0.6);
    showOverlay('win', '残塔尽碎', '三关打穿。残像主脑的核散了。');
    hud();
  }

  function afterBoss() {
    addScore(SCORE.clear);
    toast(stageDef().name + ' 肃清', false, true);
    G.boss = false;
    if (G.stage >= STAGES.length) {
      G.winT = 1.32;
    } else {
      G.stage += 1;
      G.clock = 0;
      G.waveI = 0;
      G.invuln = Math.max(G.invuln, 0.8);
      toast(stageDef().name, false, true);
      hud();
    }
  }

  function updatePod(dt) {
    const p = G.pod;
    p.spin += dt * 3.4;
    p.glow = Math.max(0, p.glow - dt * 1.8);
    p.fireCd = Math.max(0, p.fireCd - dt);
    if (!p.have) return;
    const dockX = G.px + Math.cos(G.aim) * 28;
    const dockY = G.py + Math.sin(G.aim) * 28;
    if (p.state === 'dock') {
      p.sx = lerp(p.sx, dockX, 0.28);
      p.sy = lerp(p.sy, dockY, 0.28);
      p.aim = G.aim;
    } else if (p.state === 'fly') {
      p.sx += p.vx * dt;
      p.sy += p.vy * dt;
      p.flyT = (p.flyT || 0) + dt;
      p.vx *= Math.pow(0.04, dt);
      p.vy *= Math.pow(0.04, dt);
      if (p.flyT >= 0.22 || hypot(p.vx, p.vy) < 40) {
        p.state = 'lock';
        p.vx = 0;
        p.vy = 0;
        p.flyT = 0;
        audio.lock();
        burst(p.sx, p.sy, 8, podDef().rgb, 16);
        popPodBadge();
        hud();
      }
    } else if (p.state === 'lock') {
      p.sx += Math.sin(G.t * 3.2) * 6 * dt;
      p.sy += Math.cos(G.t * 2.6) * 6 * dt;
    } else if (p.state === 'back') {
      const dx = dockX - p.sx;
      const dy = dockY - p.sy;
      const d = hypot(dx, dy) || 1;
      const spd = 480;
      p.sx += (dx / d) * spd * dt;
      p.sy += (dy / d) * spd * dt;
      if (d < 16) {
        p.state = 'dock';
        p.sx = dockX;
        p.sy = dockY;
        audio.dock();
        hitStop(0.04);
        kick(1.6);
        screenFlash(podDef().rgb, 0.22);
        popPodBadge();
        hud();
      }
    }
    p.sx = clamp(p.sx, 16, VW - 16);
    p.sy = clamp(p.sy, 16, VH - 16);

    if (playing() && G.deadT <= 0) {
      if (p.state === 'lock' || p.state === 'fly' || G.fireHold) firePod();
    }

    if ((p.state === 'fly' || p.state === 'lock') && G.ramT <= 0) {
      const pwx = G.cam + p.sx;
      for (let i = 0; i < G.ents.length; i++) {
        const e = G.ents[i];
        if (!e.alive) continue;
        if (hypot(e.x - pwx, e.y - p.sy) < e.r + POD_R - 2) {
          hurtEnemy(e, isEcho() ? 1.4 : 1, pwx, p.sy);
          audio.ram();
          G.ramT = 0.12;
          p.glow = 1;
          break;
        }
      }
    }
  }

  function updatePlayer(dt) {
    if (G.deadT > 0) return;
    let dx = 0;
    let dy = 0;
    if (inputSrc === 'ptr' && (pointer.down || pointer.hover)) {
      dx = pointer.x - G.px;
      dy = pointer.y - G.py;
      G.px = lerp(G.px, pointer.x, 0.22);
      G.py = lerp(G.py, pointer.y, 0.22);
    } else {
      if (keys.l) dx -= 1;
      if (keys.r) dx += 1;
      if (keys.u) dy -= 1;
      if (keys.d) dy += 1;
      if (dx && dy) {
        dx *= 0.707;
        dy *= 0.707;
      }
      const spd = moveSpd();
      G.px += dx * spd * dt;
      G.py += dy * spd * dt;
    }
    G.px = clamp(G.px, 28, 720);
    G.py = clamp(G.py, 22, 428);
    if (inputSrc === 'ptr') {
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) G.aim = eightWay(dx, dy);
    } else if (dx || dy) {
      G.aim = eightWay(dx, dy);
    }
    G.bank = lerp(G.bank, clamp(dy === 0 ? 0 : dy > 0 ? 1 : -1, -1, 1), 0.18);
    if (!REDUCE) {
      ghosts.push({ x: G.px, y: G.py, bank: G.bank, t: 0.22 });
      capArr(ghosts, isEcho() ? 10 : 6);
    }
    if (G.fireHold) fireMain();
  }

  function updateTitleShip(dt) {
    G.t += dt;
    G.px = 120 + Math.sin(G.t * 0.7) * 36;
    G.py = VH * 0.5 + Math.sin(G.t * 1.1) * 48;
    G.aim = eightWay(Math.cos(G.t * 0.9), Math.sin(G.t * 1.1));
    G.pod.have = true;
    G.pod.state = 'dock';
    G.pod.sx = G.px + Math.cos(G.aim) * 28;
    G.pod.sy = G.py + Math.sin(G.aim) * 28;
    G.pod.spin += dt * 2.4;
    if (!REDUCE) {
      ghosts.push({ x: G.px, y: G.py, bank: G.bank, t: 0.28 });
      capArr(ghosts, 8);
    }
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0 || s.x < G.cam - 40 || s.x > G.cam + VW + 80 || s.y < -20 || s.y > VH + 20) {
        G.shots.splice(i, 1);
        continue;
      }
      if (s.eat) {
        for (let j = G.eShots.length - 1; j >= 0; j--) {
          const es = G.eShots[j];
          if (es.fat) continue;
          if (hypot(es.x - s.x, es.y - s.y) < s.r + es.r + 2) {
            G.eShots.splice(j, 1);
            emit(3, {
              x: s.x - G.cam, y: s.y, j: 2,
              vx0: -30, vx1: 30, vy0: -30, vy1: 30,
              r0: 1, r1: 2, life: 0.16, rgb: s.rgb
            });
          }
        }
      }
      let hit = false;
      for (let k = 0; k < G.ents.length; k++) {
        const e = G.ents[k];
        if (!e.alive) continue;
        if (hypot(e.x - s.x, e.y - s.y) < e.r + s.r) {
          if (s.pierce && s.hit && s.hit[e.id]) continue;
          hurtEnemy(e, s.dmg, s.x, s.y);
          if (s.pierce) {
            if (!s.hit) s.hit = {};
            s.hit[e.id] = true;
            s.pierce -= 1;
            if (s.pierce <= 0) hit = true;
          } else hit = true;
          if (hit) break;
        }
      }
      if (hit) G.shots.splice(i, 1);
    }

    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0 || s.x < G.cam - 30 || s.x > G.cam + VW + 40 || s.y < -24 || s.y > VH + 24) {
        G.eShots.splice(i, 1);
        continue;
      }
      if (G.invuln > 0 || G.deadT > 0) continue;
      const dx = s.x - (G.cam + G.px);
      const dy = s.y - G.py;
      if (dx * dx + dy * dy < (HIT_R + s.r) * (HIT_R + s.r)) {
        G.eShots.splice(i, 1);
        playerHit(s.fat ? '粗弹' : '中弹');
      }
    }
  }

  function updateEnts(dt) {
    const rate = isEcho() ? 0.78 : 1;
    for (let i = G.ents.length - 1; i >= 0; i--) {
      const e = G.ents[i];
      if (!e.alive) {
        G.ents.splice(i, 1);
        continue;
      }
      e.ph += dt;
      e.flash = Math.max(0, e.flash - dt);
      e.x += (e.vx || 0) * dt;
      e.y += (e.vy || 0) * dt;
      if (e.kind === 'dart') {
        e.y += Math.sin(e.ph * 3.2 + e.x * 0.01) * 28 * dt;
      } else if (e.kind === 'wing') {
        const py = G.py;
        e.vy = clamp((py - e.y) * 1.4, -50, 50);
        e.fireCd -= dt;
        if (e.fireCd <= 0 && e.x < G.cam + VW - 20) {
          e.fireCd = 1.35 * rate;
          enemyFire(e, true, 1, false);
        }
      } else if (e.kind === 'turret') {
        e.fireCd -= dt;
        if (e.fireCd <= 0 && e.x < G.cam + VW - 10) {
          e.fireCd = 1.08 * rate;
          enemyFire(e, true, isEcho() ? 2 : 1, false);
        }
      } else if (e.kind === 'ring') {
        e.spin = (e.spin || 0) + dt * 1.8;
        e.y += Math.sin(e.ph * 1.6) * 22 * dt;
        e.fireCd -= dt;
        if (e.fireCd <= 0 && e.x < G.cam + VW - 20) {
          e.fireCd = 1.55 * rate;
          ringFire(e);
        }
      } else if (e.kind === 'prism') {
        e.y = VH * 0.5 + Math.sin(e.ph * 1.1) * 70;
        e.fireCd -= dt;
        if (e.fireCd <= 0 && e.x < G.cam + VW - 30) {
          e.fireCd = 1.15 * rate;
          enemyFire(e, true, 3, Math.random() < 0.22);
        }
      } else if (e.kind === 'ghost') {
        e.fade = 0.55 + 0.45 * Math.sin(e.ph * 6);
        e.fireCd -= dt;
        if (e.fireCd <= 0 && e.x < G.cam + VW) {
          e.fireCd = 1.7 * rate;
          enemyFire(e, true, 1, false);
        }
      } else if (e.kind === 'boss') {
        updateBoss(e, dt);
      }
      if (e.kind !== 'boss' && (e.x < G.cam - 70 || e.x > G.cam + VW + 160 || e.y < -40 || e.y > VH + 40)) {
        G.ents.splice(i, 1);
        continue;
      }
      if (G.invuln <= 0 && G.deadT <= 0 && playing() && e.kind !== 'ghost') {
        const dx = e.x - (G.cam + G.px);
        const dy = e.y - G.py;
        const rr = e.r + HIT_R - 1;
        if (dx * dx + dy * dy < rr * rr) playerHit('撞机体');
      }
    }
  }

  function updateBoss(b, dt) {
    const tx = G.cam + VW - 148;
    if (b.x > tx) b.x += Math.min(-40, (tx - b.x) * 1.6) * dt;
    else b.x = lerp(b.x, tx, 0.04);
    b.pat += dt;
    const half = b.hp < b.max * 0.5;
    const rate = (isEcho() ? 0.78 : 1) * (half ? 0.72 : 1);
    if (G.stage === 1) {
      b.y = VH * 0.5 + Math.sin(b.ph * 0.9) * 88;
      b.fireCd -= dt;
      if (b.fireCd <= 0) {
        b.fireCd = 0.82 * rate;
        ringFire(b);
        if (half) enemyFire(b, true, 3, false);
      }
      if (b.pat > 2.2) {
        b.pat = 0;
        enemyFire(b, true, half ? 5 : 3, half);
      }
    } else if (G.stage === 2) {
      b.y = lerp(b.y, clamp(G.py, 70, VH - 70), 0.08);
      b.fireCd -= dt;
      if (b.fireCd <= 0) {
        b.fireCd = 0.55 * rate;
        enemyFire(b, true, half ? 2 : 1, false);
        const a = Math.PI + Math.sin(b.ph * 2.4) * 0.6;
        for (let k = -1; k <= 1; k++) {
          G.eShots.push({
            x: b.x - 20, y: b.y + k * 16,
            vx: Math.cos(a) * 180, vy: Math.sin(a) * 40 + k * 20,
            r: 3.2, life: 3.4, fat: false, rgb: CYN
          });
        }
      }
      if (b.pat > 1.8) {
        b.pat = 0;
        enemyFire(b, false, half ? 5 : 3, true);
      }
    } else {
      b.y = VH * 0.5 + Math.sin(b.ph * 0.7) * 64;
      b.fireCd -= dt;
      if (b.fireCd <= 0) {
        b.fireCd = 0.7 * rate;
        ringFire(b);
        enemyFire(b, true, half ? 3 : 1, false);
      }
      if (b.pat > 2.4) {
        b.pat = 0;
        spawnGhost(b.x - 30, b.y - 40);
        spawnGhost(b.x - 30, b.y + 40);
        if (half) {
          spawnGhost(b.x - 10, b.y);
          enemyFire(b, true, 5, true);
        }
      }
    }
  }

  function updateDrops(dt) {
    const px = G.cam + G.px;
    for (let i = G.drops.length - 1; i >= 0; i--) {
      const d = G.drops[i];
      d.t += dt;
      d.life -= dt;
      const dx = px - d.x;
      const dy = G.py - d.y;
      const dist = hypot(dx, dy);
      if (dist < 92) {
        d.x += (dx / (dist || 1)) * 220 * dt;
        d.y += (dy / (dist || 1)) * 220 * dt;
      } else {
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        d.vy += Math.sin(d.t * 4) * 10 * dt;
      }
      d.y = clamp(d.y, 24, VH - 24);
      if (d.life <= 0 || d.x < G.cam - 40) {
        G.drops.splice(i, 1);
        continue;
      }
      if (playing() && G.deadT <= 0 && dist < 18) {
        collectDrop(d);
        G.drops.splice(i, 1);
      }
    }
  }

  function updateFx(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
      p.vx *= 0.98;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt * 4.2;
      if (sparks[i].t >= 1) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt * 2.6;
      if (rings[i].t >= 1) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y -= 28 * dt;
      if (f.t >= f.life) floats.splice(i, 1);
    }
    for (let i = ghosts.length - 1; i >= 0; i--) {
      ghosts[i].t -= dt;
      if (ghosts[i].t <= 0) ghosts.splice(i, 1);
    }
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.shake = Math.max(0, G.shake - dt * 14);
    G.punch = lerp(G.punch, 1, 0.18);
    G.muzzle = Math.max(0, G.muzzle - dt * 8);
    G.toastT = Math.max(0, G.toastT - dt);
  }

  function update(dt) {
    G.t += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.35);
      return;
    }
    G.podCd = Math.max(0, G.podCd - dt);
    G.ramT = Math.max(0, G.ramT - dt);
    G.fireCd = Math.max(0, G.fireCd - dt);
    G.invuln = Math.max(0, G.invuln - dt);

    if (G.mode === 'title') {
      G.cam += 42 * dt;
      updateTitleShip(dt);
      updatePod(dt);
      updateFx(dt);
      return;
    }

    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
        hud();
      }
    }

    if (G.deadT > 0) {
      G.deadT -= dt;
      if (G.deadT <= 0) finishDeath();
    }

    if (playing() && G.deadT <= 0) {
      G.clock += dt;
      G.cam += scrollSpd() * dt;
      updatePlayer(dt);
      maybeSpawn();
    } else if (G.mode === 'win' || G.mode === 'lose') {
      G.cam += 28 * dt;
    }

    updatePod(dt);
    updateShots(dt);
    updateEnts(dt);
    updateDrops(dt);
    updateFx(dt);

    if (G.winT > 0) {
      G.winT -= dt;
      if (G.winT <= 0) winGame();
    }
  }

  function drawDiamond(x, y, r, rgb, a, rot) {
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.rotate(rot || 0);
    ctx.beginPath();
    ctx.moveTo(0, -r * scale);
    ctx.lineTo(r * scale, 0);
    ctx.lineTo(0, r * scale);
    ctx.lineTo(-r * scale, 0);
    ctx.closePath();
    ctx.fillStyle = rgba(rgb, a);
    ctx.fill();
    ctx.restore();
  }

  function palette() {
    const th = stageDef().theme;
    if (th === 'rail') return { bg: [8, 10, 28], a: CYN, b: VIO, c: [40, 80, 140] };
    if (th === 'echo') return { bg: [14, 6, 28], a: MAG, b: VIO, c: [80, 30, 90] };
    return { bg: [8, 6, 24], a: VIO, b: CYN, c: [40, 28, 90] };
  }

  function drawBg(pal) {
    ctx.fillStyle = rgba(pal.bg, 1);
    ctx.fillRect(0, 0, W, H);
    const g = ctx.createLinearGradient(0, oy, 0, oy + VH * scale);
    g.addColorStop(0, rgba(pal.a, 0.12));
    g.addColorStop(0.5, 'transparent');
    g.addColorStop(1, rgba(pal.b, 0.1));
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);

    ctx.save();
    ctx.beginPath();
    ctx.rect(ox, oy, VW * scale, VH * scale);
    ctx.clip();

    const cam = G.cam;
    ctx.strokeStyle = rgba(pal.a, 0.08);
    ctx.lineWidth = 1;
    const gap = 36;
    const off = (cam * 0.35) % gap;
    for (let x = -off; x < VW + gap; x += gap) {
      ctx.beginPath();
      ctx.moveTo(sx(x), sy(0));
      ctx.lineTo(sx(x), sy(VH));
      ctx.stroke();
    }
    for (let y = 0; y < VH; y += gap) {
      ctx.beginPath();
      ctx.moveTo(sx(0), sy(y));
      ctx.lineTo(sx(VW), sy(y));
      ctx.stroke();
    }

    for (let i = 0; i < decos.length; i++) {
      const d = decos[i];
      let dx = ((d.x - cam * 0.55) % (VW + 200) + (VW + 200)) % (VW + 200) - 40;
      const col = d.kind === 0 ? pal.a : d.kind === 1 ? pal.b : pal.c;
      ctx.fillStyle = rgba(col, 0.16);
      ctx.strokeStyle = rgba(col, 0.32);
      ctx.lineWidth = 1.2 * scale;
      ctx.beginPath();
      if (d.kind === 0) {
        ctx.moveTo(sx(dx), sy(d.y));
        ctx.lineTo(sx(dx + d.w * 0.5), sy(d.y - d.h));
        ctx.lineTo(sx(dx + d.w), sy(d.y));
        ctx.closePath();
      } else {
        ctx.rect(sx(dx), sy(d.y - d.h * 0.5), d.w * scale, d.h * scale);
      }
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawStars() {
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.x -= s.z * (G.boss ? 12 : 28) * (1 / 60);
      if (s.x < -4) s.x = VW + rand(0, 40);
      const tw = 0.45 + 0.55 * Math.abs(Math.sin(G.t * 2 + s.tw));
      ctx.fillStyle = rgba(WHT, 0.18 + tw * 0.45 * s.z);
      ctx.fillRect(sx(s.x), sy(s.y), s.s * scale, s.s * scale);
    }
  }

  function drawShot(s) {
    const x = s.x - G.cam;
    const y = s.y;
    if (s.kind === 'beam') {
      ctx.save();
      ctx.translate(sx(x), sy(y));
      ctx.rotate(Math.atan2(s.vy, s.vx));
      ctx.fillStyle = rgba(s.rgb, 0.95);
      ctx.fillRect(0, -1.3 * scale, 22 * scale, 2.6 * scale);
      ctx.fillStyle = rgba(WHT, 0.7);
      ctx.fillRect(0, -0.6 * scale, 22 * scale, 1.2 * scale);
      ctx.restore();
    } else if (s.kind === 'ring') {
      drawDiamond(x, y, s.r + 1, s.rgb, 0.95, G.t * 8);
    } else {
      ctx.fillStyle = rgba(s.rgb, 0.95);
      ctx.beginPath();
      ctx.ellipse(sx(x), sy(y), 5.5 * scale, 1.8 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.7);
      ctx.beginPath();
      ctx.ellipse(sx(x + 1), sy(y), 3.2 * scale, 1 * scale, 0, 0, TAU);
      ctx.fill();
    }
  }

  function drawEnemy(e) {
    const x = e.x - G.cam;
    const y = e.y;
    const flash = e.flash > 0;
    const rgb = flash ? WHT : (e.kind === 'ghost' ? VIO : e.kind === 'prism' ? MAG : e.kind === 'turret' ? GOLD : CYN);
    const a = e.kind === 'ghost' ? (e.fade || 0.7) : 1;
    ctx.save();
    ctx.translate(sx(x), sy(y));
    if (e.kind === 'dart') {
      ctx.fillStyle = rgba(rgb, a);
      ctx.beginPath();
      ctx.moveTo(-12 * scale, 0);
      ctx.lineTo(8 * scale, -7 * scale);
      ctx.lineTo(4 * scale, 0);
      ctx.lineTo(8 * scale, 7 * scale);
      ctx.closePath();
      ctx.fill();
    } else if (e.kind === 'wing') {
      ctx.fillStyle = rgba(rgb, a);
      ctx.beginPath();
      ctx.moveTo(12 * scale, 0);
      ctx.lineTo(-8 * scale, -11 * scale);
      ctx.lineTo(-4 * scale, 0);
      ctx.lineTo(-8 * scale, 11 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.8);
      ctx.fillRect(-2 * scale, -2 * scale, 6 * scale, 4 * scale);
    } else if (e.kind === 'turret') {
      ctx.fillStyle = rgba(DEEP, 0.9);
      ctx.fillRect(-10 * scale, -8 * scale, 20 * scale, 16 * scale);
      ctx.strokeStyle = rgba(rgb, a);
      ctx.lineWidth = 1.4 * scale;
      ctx.strokeRect(-10 * scale, -8 * scale, 20 * scale, 16 * scale);
      ctx.fillStyle = rgba(rgb, a);
      ctx.beginPath();
      ctx.arc(0, 0, 4 * scale, 0, TAU);
      ctx.fill();
    } else if (e.kind === 'ring') {
      ctx.rotate(e.spin || 0);
      ctx.strokeStyle = rgba(rgb, a);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(0, 0, 12 * scale, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = rgba(rgb, a * 0.8);
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(10 * scale, -2 * scale, 6 * scale, 4 * scale);
        ctx.rotate(Math.PI / 2);
      }
    } else if (e.kind === 'prism') {
      ctx.fillStyle = rgba(rgb, a);
      ctx.beginPath();
      ctx.moveTo(18 * scale, 0);
      ctx.lineTo(0, -14 * scale);
      ctx.lineTo(-16 * scale, -8 * scale);
      ctx.lineTo(-16 * scale, 8 * scale);
      ctx.lineTo(0, 14 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.5);
      ctx.fillRect(-6 * scale, -4 * scale, 10 * scale, 8 * scale);
    } else if (e.kind === 'ghost') {
      ctx.globalAlpha = a;
      ctx.strokeStyle = rgba(rgb, 0.9);
      ctx.lineWidth = 1.6 * scale;
      ctx.beginPath();
      ctx.moveTo(-8 * scale, 0);
      ctx.lineTo(8 * scale, -6 * scale);
      ctx.lineTo(4 * scale, 0);
      ctx.lineTo(8 * scale, 6 * scale);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBoss(b) {
    const x = b.x - G.cam;
    const y = b.y;
    const flash = b.flash > 0;
    const rgb = flash ? WHT : (G.stage === 3 ? MAG : G.stage === 2 ? CYN : VIO);
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.rotate(G.stage === 1 ? b.ph * 0.4 : 0);
    ctx.fillStyle = rgba(DEEP, 0.92);
    ctx.strokeStyle = rgba(rgb, 0.95);
    ctx.lineWidth = 2.2 * scale;
    ctx.beginPath();
    if (G.stage === 2) {
      ctx.rect(-32 * scale, -22 * scale, 64 * scale, 44 * scale);
    } else {
      ctx.moveTo(0, -34 * scale);
      ctx.lineTo(30 * scale, 0);
      ctx.lineTo(0, 34 * scale);
      ctx.lineTo(-30 * scale, 0);
      ctx.closePath();
    }
    ctx.fill();
    ctx.stroke();
    const core = mix(rgb, GOLD, 0.4 + 0.4 * Math.sin(G.t * 6));
    ctx.fillStyle = rgba(core, 0.95);
    ctx.beginPath();
    ctx.arc(0, 0, 10 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.7);
    ctx.beginPath();
    ctx.arc(-2 * scale, -2 * scale, 3.2 * scale, 0, TAU);
    ctx.fill();
    ctx.restore();

    const ratio = clamp(b.hp / b.max, 0, 1);
    const bw = 120;
    const bx = VW - 148;
    const by = 16;
    ctx.fillStyle = rgba(DEEP, 0.7);
    ctx.fillRect(sx(bx), sy(by), bw * scale, 7 * scale);
    ctx.fillStyle = rgba(ratio < 0.3 ? HOT : GOLD, 0.9);
    ctx.fillRect(sx(bx), sy(by), bw * ratio * scale, 7 * scale);
    ctx.strokeStyle = rgba(WHT, 0.35);
    ctx.lineWidth = 1;
    ctx.strokeRect(sx(bx), sy(by), bw * scale, 7 * scale);
  }

  function drawShipAt(x, y, bank, ghost) {
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.rotate(bank * 0.18);
    const a = ghost == null ? 1 : ghost;
    ctx.globalAlpha = a;
    ctx.fillStyle = rgba(CYN, 0.95);
    ctx.beginPath();
    ctx.moveTo(16 * scale, 0);
    ctx.lineTo(-6 * scale, -9 * scale);
    ctx.lineTo(-12 * scale, -3 * scale);
    ctx.lineTo(-12 * scale, 3 * scale);
    ctx.lineTo(-6 * scale, 9 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(VIO, 0.95);
    ctx.beginPath();
    ctx.moveTo(8 * scale, 0);
    ctx.lineTo(-2 * scale, -5 * scale);
    ctx.lineTo(-8 * scale, 0);
    ctx.lineTo(-2 * scale, 5 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.fillRect(-2 * scale, -2.2 * scale, 8 * scale, 4.4 * scale);
    ctx.fillStyle = rgba(HOT, 0.85);
    ctx.fillRect(-12 * scale, -5 * scale, 4 * scale, 3 * scale);
    ctx.fillRect(-12 * scale, 2 * scale, 4 * scale, 3 * scale);
    if (G.muzzle > 0 && ghost == null) {
      ctx.fillStyle = rgba(WHT, G.muzzle);
      ctx.fillRect(14 * scale, -1.4 * scale, 10 * scale, 2.8 * scale);
    }
    ctx.restore();
  }

  function drawAimTicks() {
    if (!G.pod.have || G.deadT > 0) return;
    ctx.save();
    ctx.translate(sx(G.px), sy(G.py));
    for (let i = 0; i < 8; i++) {
      const a = i * (Math.PI / 4);
      const on = Math.abs(((G.aim - a + Math.PI) % TAU) - Math.PI) < 0.01;
      const r = 22;
      ctx.fillStyle = rgba(on ? podDef().rgb : WHT, on ? 0.9 : 0.18);
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r * scale, Math.sin(a) * r * scale, (on ? 2.4 : 1.3) * scale, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawPod() {
    const p = G.pod;
    if (!p.have) return;
    const def = podDef();
    const ang = p.state === 'dock' ? G.aim : p.aim;
    ctx.save();
    ctx.translate(sx(p.sx), sy(p.sy));
    ctx.rotate(ang);
    if (p.state === 'lock') {
      ctx.strokeStyle = rgba(def.rgb, 0.35 + 0.25 * Math.sin(G.t * 8));
      ctx.lineWidth = 1.4 * scale;
      ctx.setLineDash([4 * scale, 4 * scale]);
      ctx.beginPath();
      ctx.arc(0, 0, 16 * scale, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.fillStyle = rgba(def.rgb, 0.95);
    ctx.beginPath();
    ctx.moveTo(10 * scale, 0);
    ctx.lineTo(0, -8 * scale);
    ctx.lineTo(-8 * scale, 0);
    ctx.lineTo(0, 8 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.85);
    ctx.beginPath();
    ctx.arc(-1 * scale, 0, 3.2 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(def.rgb, 0.9);
    ctx.fillRect(8 * scale, -1.5 * scale, 8 * scale, 3 * scale);
    if (p.glow > 0) {
      ctx.strokeStyle = rgba(def.rgb, p.glow);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(0, 0, 12 * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPlayer() {
    if (G.mode !== 'play' && G.mode !== 'title') return;
    if (G.deadT > 0) return;
    if (G.invuln > 0 && G.mode === 'play' && ((G.t * 18) | 0) % 2 === 0) return;
    for (let i = 0; i < ghosts.length; i++) {
      const g = ghosts[i];
      drawShipAt(g.x, g.y, g.bank, 0.12 * (g.t / 0.22));
    }
    drawShipAt(G.px, G.py, G.bank, null);
    drawAimTicks();
    drawPod();
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * scale * a, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      ctx.strokeStyle = rgba(s.rgb, 1 - s.t);
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.rad * s.t * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      ctx.strokeStyle = rgba(r.rgb, 0.7 * (1 - r.t));
      ctx.lineWidth = 2 * scale * (1 - r.t);
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (r.r + r.t * 28) * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.font = (11 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      ctx.fillStyle = rgba(f.rgb, 1 - f.t / f.life);
      ctx.fillText(f.text, sx(f.x), sy(f.y));
    }
  }

  function drawDrops() {
    for (let i = 0; i < G.drops.length; i++) {
      const d = G.drops[i];
      const def = PODS[d.type];
      const x = d.x - G.cam;
      drawDiamond(x, d.y, 8 + Math.sin(d.t * 8) * 1.2, def.rgb, 0.95, d.t);
      ctx.strokeStyle = rgba(WHT, 0.5);
      ctx.lineWidth = 1 * scale;
      ctx.beginPath();
      ctx.arc(sx(x), sy(d.y), 11 * scale, 0, TAU);
      ctx.stroke();
    }
  }

  function drawEShots() {
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      const x = s.x - G.cam;
      if (s.fat) {
        ctx.fillStyle = rgba(s.rgb, 0.95);
        ctx.beginPath();
        ctx.arc(sx(x), sy(s.y), s.r * scale, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba(WHT, 0.5);
        ctx.beginPath();
        ctx.arc(sx(x - 1), sy(s.y - 1), s.r * 0.4 * scale, 0, TAU);
        ctx.fill();
      } else {
        drawDiamond(x, s.y, s.r + 0.6, s.rgb, 0.92, G.t * 4);
      }
    }
  }

  function draw() {
    const pal = palette();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#080618';
    ctx.fillRect(0, 0, W, H);

    let kx = 0;
    let ky = 0;
    if (G.shake > 0 && !REDUCE) {
      kx = rand(-G.shake, G.shake);
      ky = rand(-G.shake, G.shake);
    }
    ctx.save();
    ctx.translate(kx * scale, ky * scale);
    if (G.punch !== 1 && !REDUCE) {
      ctx.translate(sx(VW * 0.5), sy(VH * 0.5));
      ctx.scale(G.punch, G.punch);
      ctx.translate(-sx(VW * 0.5), -sy(VH * 0.5));
    }

    drawBg(pal);
    drawStars();
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].kind === 'boss') drawBoss(G.ents[i]);
      else drawEnemy(G.ents[i]);
    }
    drawDrops();
    for (let i = 0; i < G.shots.length; i++) drawShot(G.shots[i]);
    drawEShots();
    drawPlayer();
    drawParticles();

    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.45);
      ctx.fillRect(ox, oy, VW * scale, VH * scale);
    }
    ctx.restore();
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, rect.width * dpr);
    H = Math.max(1, rect.height * dpr);
    canvas.width = W;
    canvas.height = H;
    const fit = Math.min(W / VW, H / VH);
    scale = fit;
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
  }

  function pointerVirtX(e) {
    const rect = canvas.getBoundingClientRect();
    return (e.clientX - rect.left) * dpr / scale - ox / scale;
  }
  function pointerVirtY(e) {
    const rect = canvas.getBoundingClientRect();
    return (e.clientY - rect.top) * dpr / scale - oy / scale;
  }

  function startGame(kind) {
    G.mode = 'play';
    G.kind = kind === 'echo' ? 'echo' : 'fight';
    G.stage = 1;
    G.t = 0;
    G.clock = 0;
    G.cam = 0;
    G.px = 90;
    G.py = VH * 0.5;
    G.vx = 0;
    G.vy = 0;
    G.bank = 0;
    G.aim = 0;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.lives = LIVES;
    G.nextLife = LIFE_EVERY;
    G.fireHold = false;
    G.fireCd = 0;
    G.deadT = 0;
    G.invuln = 1.05;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.muzzle = 0;
    G.waveI = 0;
    G.why = '';
    G.winT = 0;
    G.boss = false;
    G.podCd = 0;
    G.ramT = 0;
    G.pod.have = true;
    G.pod.type = 0;
    G.pod.state = 'dock';
    G.pod.sx = G.px + 28;
    G.pod.sy = G.py;
    G.pod.vx = 0;
    G.pod.vy = 0;
    G.pod.aim = 0;
    G.pod.fireCd = 0;
    G.pod.glow = 1;
    clearField();
    seedStars();
    seedDecos();
    hideOverlay();
    hud();
    audio.start();
    toast(isEcho() ? '残像 · 残影会还手' : '幻击 · 红散已装', false, true);
    if (scoreEl) scoreEl.textContent = '0';
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'fight';
    G.stage = 1;
    G.lives = LIVES;
    G.combo = 0;
    G.mult = 1;
    G.deadT = 0;
    G.score = 0;
    G.px = 120;
    G.py = VH * 0.5;
    G.aim = 0;
    G.invuln = 9;
    G.boss = false;
    G.pod.have = true;
    G.pod.type = 0;
    G.pod.state = 'dock';
    clearField();
    seedStars();
    seedDecos();
    showOverlay('title', '幻击', '八向甩核。空格正射，Shift 把幻核抛成炮台，再按收回。撞机掉命。');
    hud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('fight');
    else startGame(G.kind || 'fight');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('fight');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isPod = k === 'Shift' || code === 'ShiftLeft' || code === 'ShiftRight' || k === 'z' || k === 'Z';
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'a' || k === 'A' || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S';
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';

    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') {
      keys.l = down;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') {
      keys.r = down;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') {
      keys.u = down;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') {
      keys.d = down;
      if (down) inputSrc = 'key';
    }

    if (down && (isMove || space || isPod || k === 'Enter')) e.preventDefault();

    if (!down) {
      if (space) G.fireHold = false;
      return;
    }
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
      return;
    }
    if (k === '1' && G.mode === 'title') {
      audio.ensure();
      startGame('fight');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      audio.ensure();
      startGame('echo');
      return;
    }
    if (isPod) {
      if (!e.repeat) {
        audio.ensure();
        togglePod();
      }
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        if (space && G.mode === 'play') G.fireHold = true;
        return;
      }
      if (G.mode === 'play') {
        G.fireHold = true;
        fireMain();
      }
    }
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      pointer.down = true;
      pointer.hover = true;
      pointer.id = e.pointerId;
      pointer.x = clamp(pointerVirtX(e), 0, VW);
      pointer.y = pointerVirtY(e);
      inputSrc = 'ptr';
      G.fireHold = true;
      if (G.mode === 'play') fireMain();
      if (G.mode === 'title') startGame('fight');
      else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      pointer.x = clamp(pointerVirtX(e), 0, VW);
      pointer.y = pointerVirtY(e);
      if (!pointer.down && e.pointerType === 'mouse') pointer.hover = true;
      if (pointer.down) inputSrc = 'ptr';
    });
    function up(e) {
      if (pointer.id != null && e.pointerId !== pointer.id && pointer.down) return;
      pointer.down = false;
      pointer.id = null;
      G.fireHold = false;
    }
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('pointerleave', function () {
      pointer.hover = false;
    });
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  let acc = 0;
  let last = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (hidden) {
      last = now * 0.001;
      return;
    }
    const t = now * 0.001;
    if (!last) last = t;
    let dt = t - last;
    last = t;
    if (dt > 0.05) dt = 0.05;
    acc += dt;
    let n = 0;
    while (acc >= STEP && n < 5) {
      update(STEP);
      acc -= STEP;
      n += 1;
    }
    draw();
  }

  function initMute() {
    let m = false;
    try { m = localStorage.getItem(MUTE_KEY) === '1'; } catch (err) { m = false; }
    audio.setMuted(m);
  }

  loadBest();
  initMute();
  goTitle();
  resize();
  bindPointer();

  if (btnFight) {
    btnFight.addEventListener('click', function () {
      audio.ensure();
      startGame('fight');
    });
  }
  if (btnEcho) {
    btnEcho.addEventListener('click', function () {
      audio.ensure();
      startGame('echo');
    });
  }
  if (btnOvRetry) {
    btnOvRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind || 'fight');
    });
  }
  if (btnOvModes) {
    btnOvModes.addEventListener('click', function () {
      audio.ensure();
      goTitle();
    });
  }
  if (btnRetry) btnRetry.addEventListener('click', restart);
  if (btnMute) {
    btnMute.addEventListener('click', function () {
      audio.ensure();
      audio.setMuted(!audio.muted);
    });
  }
  if (btnPod) {
    btnPod.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      audio.ensure();
      btnPod.classList.add('held');
      togglePod();
    });
    btnPod.addEventListener('pointerup', function () {
      btnPod.classList.remove('held');
    });
    btnPod.addEventListener('pointerleave', function () {
      btnPod.classList.remove('held');
    });
  }

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
  });

  requestAnimationFrame(frame);
})();
