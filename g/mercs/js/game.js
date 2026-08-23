'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 15000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.48;
  const WALK = 220;
  const FIRE_CD = 0.088;
  const SHOT_SPD = 640;
  const MAX_PSHOT = 8;
  const NADE_MAX = 9;
  const NADE_START = 5;
  const NADE_CD = 0.44;
  const NADE_SPD = 270;
  const NADE_VZ = 360;
  const NADE_G = 980;
  const NADE_R = 56;
  const INVULN = 1.22;
  const DIE_T = 0.86;
  const WALL_L = 36;
  const WALL_R = 444;
  const HIT_R = 10;
  const SPREAD_T = 8.2;
  const BEST_KEY = 'playbox-mercs-best';
  const MUTE_KEY = 'playbox-mercs-mute';
  const OPS = '方向 / WASD 走 · 空格射击 · Shift / Z 手雷 · R 重开 · M 静音';
  const LEAD = '往上推进、朝面向开火。碉堡挡住子弹，手雷越过沙袋砸开。救人补雷。撞上丢一条命。短关之后是关底。';

  const MAG = [255, 61, 184];
  const CYN = [0, 232, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 154, 20];
  const HOT2 = [255, 196, 90];
  const LEAF = [61, 255, 122];
  const WHT = [255, 246, 232];
  const MUD = [168, 120, 64];
  const IRON = [48, 36, 24];
  const STL = [92, 72, 48];
  const DEEP = [16, 10, 4];
  const KHAKI = [196, 148, 72];
  const PINK = [255, 154, 180];

  const SCORE = {
    grunt: 80,
    runner: 120,
    bunker: 180,
    sniper: 150,
    jeep: 220,
    pow: 400,
    boss: 3400,
    stage: 1400
  };

  const STAGES = [
    {
      name: '林道',
      boss: '铁甲车',
      hp: 56,
      theme: 'jungle',
      waves: [
        { t: 0.5, kind: 'grunts', n: 5 },
        { t: 2.4, kind: 'bunkers' },
        { t: 4.2, kind: 'runners', n: 3 },
        { t: 6.0, kind: 'pow' },
        { t: 7.6, kind: 'snipers', n: 2 },
        { t: 9.4, kind: 'mix1' },
        { t: 12.0, kind: 'jeep' },
        { t: 14.2, kind: 'grunts', n: 6 },
        { t: 17.2, kind: 'boss' }
      ]
    },
    {
      name: '河谷',
      boss: '岸炮',
      hp: 72,
      theme: 'river',
      waves: [
        { t: 0.45, kind: 'grunts', n: 6 },
        { t: 2.1, kind: 'bunkers' },
        { t: 3.8, kind: 'runners', n: 4 },
        { t: 5.4, kind: 'snipers', n: 3 },
        { t: 7.0, kind: 'pow' },
        { t: 8.6, kind: 'jeep' },
        { t: 10.4, kind: 'mix2' },
        { t: 12.8, kind: 'bunkers' },
        { t: 14.6, kind: 'grunts', n: 7 },
        { t: 18.0, kind: 'boss' }
      ]
    },
    {
      name: '据点',
      boss: '据点司令',
      hp: 92,
      theme: 'base',
      waves: [
        { t: 0.4, kind: 'grunts', n: 7 },
        { t: 1.8, kind: 'bunkers' },
        { t: 3.4, kind: 'runners', n: 5 },
        { t: 5.0, kind: 'snipers', n: 3 },
        { t: 6.4, kind: 'jeep' },
        { t: 7.8, kind: 'pow' },
        { t: 9.2, kind: 'mix3' },
        { t: 11.4, kind: 'bunkers' },
        { t: 13.0, kind: 'grunts', n: 8 },
        { t: 15.2, kind: 'jeep' },
        { t: 18.4, kind: 'boss' }
      ]
    }
  ];

  const hasDom = typeof document !== 'undefined';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  function el(id) {
    return hasDom ? document.getElementById(id) : null;
  }
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
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function capArr(arr, n) {
    if (arr.length > n) arr.splice(0, arr.length - n);
  }
  function nadePeak() {
    return (NADE_VZ * NADE_VZ) / (2 * NADE_G);
  }
  function isDense() {
    return G.kind === 'dense';
  }
  function dens() {
    return isDense() ? 1.28 : 1;
  }
  function spdMul() {
    return (isDense() ? 1.26 : 1) * (1 + Math.max(0, G.stage - 1) * 0.07);
  }
  function hpMul() {
    return isDense() ? 1.22 : 1;
  }
  function scrollSpd() {
    if (G.boss && G.boss.active && !G.boss.dead) return isDense() ? 26 : 16;
    return isDense() ? 100 : 70;
  }
  function fireRate() {
    return isDense() ? 0.074 : FIRE_CD;
  }
  function eFireMul() {
    return isDense() ? 0.74 : 1;
  }
  function isCover(kind) {
    return kind === 'bunker';
  }
  function isHostile(kind) {
    return kind !== 'pow';
  }
  function hpOf(kind) {
    if (kind === 'bunker') return 5;
    if (kind === 'jeep') return 3;
    if (kind === 'sniper') return 2;
    return 1;
  }
  function rOf(kind) {
    if (kind === 'bunker') return 16;
    if (kind === 'jeep') return 16;
    if (kind === 'pow') return 12;
    return 11;
  }
  function scoreOf(kind) {
    return SCORE[kind] || 80;
  }

  function selfCheck() {
    if (STAGES.length !== 3) throw new Error('3 stages');
    if (LIVES !== 3) throw new Error('3 lives');
    if (BEST_KEY !== 'playbox-mercs-best') throw new Error('best key');
    if (MUTE_KEY !== 'playbox-mercs-mute') throw new Error('mute key');
    const peak = nadePeak();
    if (peak < 50) throw new Error('nade peak ' + peak);
    if (peak <= 22 + 20) throw new Error('nade not over bunker');
    if (WALL_R - WALL_L < 300) throw new Error('corridor');
    if (FIRE_CD >= 0.12) throw new Error('fire cd');
    if (NADE_R < 40) throw new Error('nade radius');
    if (STAGES[0].hp >= STAGES[1].hp || STAGES[1].hp >= STAGES[2].hp) throw new Error('boss hp');
    if (STAGES[0].waves.length >= STAGES[2].waves.length) throw new Error('later denser');
    let i;
    for (i = 0; i < STAGES.length; i++) {
      const s = STAGES[i];
      if (!s.name || !s.boss || !s.waves.length) throw new Error('stage ' + i);
      const last = s.waves[s.waves.length - 1];
      if (last.kind !== 'boss') throw new Error('boss last ' + s.name);
    }
    if (!isCover('bunker') || isCover('grunt')) throw new Error('cover rules');
    if (isHostile('pow') || !isHostile('grunt')) throw new Error('pow rules');
    G.kind = 'dense';
    G.stage = 1;
    if (spdMul() <= 1) throw new Error('dense faster');
    G.kind = 'raid';
    G.stage = 2;
    const later = spdMul();
    G.stage = 1;
    if (later <= spdMul()) throw new Error('later faster');
    return true;
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
        this.master.gain.value = this.muted ? 0 : 0.32;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.32;
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
    shot() {
      this.ensure();
      this.beep(980, 0.038, 'square', 0.036, 360);
      this.noise(0.018, 0.016, 1600);
    },
    spread() {
      this.ensure();
      this.beep(720, 0.05, 'square', 0.034, 280);
      this.beep(1240, 0.04, 'triangle', 0.022, 520);
    },
    nade() {
      this.ensure();
      this.beep(180, 0.08, 'sine', 0.04, 90);
      this.beep(420, 0.07, 'square', 0.03, 180);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.032, 0.03, 1200);
      this.beep(620 * lift, 0.055, 'square', 0.038, 980 * lift);
    },
    boom() {
      this.ensure();
      this.noise(0.16, 0.07, 220);
      this.beep(160, 0.18, 'sawtooth', 0.05, 46);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    death() {
      this.ensure();
      this.noise(0.16, 0.055, 320);
      this.beep(280, 0.2, 'sawtooth', 0.05, 70);
      this.beep(140, 0.32, 'sine', 0.045, 42);
    },
    boss() {
      this.ensure();
      this.beep(110, 0.2, 'sawtooth', 0.06, 55);
      this.beep(330, 0.16, 'square', 0.04, 180);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'sine', 0.05);
      this.beep(659, 0.12, 'sine', 0.045);
      this.beep(784, 0.16, 'sine', 0.05);
      this.beep(1046, 0.26, 'triangle', 0.05, 1560);
    },
    lose() {
      this.ensure();
      this.beep(220, 0.18, 'sawtooth', 0.045, 90);
      this.beep(140, 0.3, 'sine', 0.05, 50);
    },
    start() {
      this.ensure();
      this.beep(330, 0.08, 'square', 0.04, 660);
      this.beep(660, 0.12, 'triangle', 0.035, 990);
    },
    stage() {
      this.ensure();
      this.beep(392, 0.09, 'sine', 0.04, 523);
      this.beep(523, 0.12, 'triangle', 0.04, 784);
    },
    oneup() {
      this.ensure();
      this.beep(660, 0.08, 'square', 0.04, 880);
      this.beep(880, 0.12, 'triangle', 0.045, 1320);
    },
    rescue() {
      this.ensure();
      this.beep(523, 0.08, 'sine', 0.045, 784);
      this.beep(784, 0.14, 'triangle', 0.04, 1176);
    },
    pickup() {
      this.ensure();
      this.beep(660, 0.07, 'square', 0.036, 990);
      this.beep(990, 0.1, 'triangle', 0.032, 1320);
    }
  };

  const G = {
    mode: 'title',
    kind: 'raid',
    t: 0,
    clock: 0,
    stage: 1,
    stageT: 0,
    waveI: 0,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    maxCombo: 0,
    comboT: 0,
    mult: 1,
    nextLife: LIFE_EVERY,
    nades: NADE_START,
    spreadT: 0,
    enemies: [],
    shots: [],
    nadeshots: [],
    pickups: [],
    player: null,
    boss: null,
    fireCd: 0,
    nadeCd: 0,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: HOT,
    punch: 1,
    muzzle: 0,
    scroll: 0,
    winT: 0,
    why: '',
    toastT: 0
  };

  if (!hasDom) {
    selfCheck();
    return;
  }

  selfCheck();

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
  const btnRaid = el('btn-raid');
  const btnDense = el('btn-dense');
  const ovAgain = el('ov-again');
  const ovMenu = el('ov-menu');
  const modeRaid = el('mode-raid');
  const modeDense = el('mode-dense');
  const btnMute = el('btn-mute');
  const btnRetry = el('btn-retry');
  const scoreEl = el('score');
  const bestEl = el('best');
  const scoreBox = el('score-box');
  const scoreAdd = el('score-add');
  const comboEl = el('combo');
  const comboBox = el('combo-box');
  const stageLabel = el('stage-label');
  const tagLabel = el('tag-label');
  const gunLabel = el('gun-label');
  const nadeLabel = el('nade-label');
  const bossWrap = el('boss-wrap');
  const bossName = el('boss-name');
  const bossBar = el('boss-bar');
  const pipsEl = el('pips');
  const toastEl = el('toast');
  const chainPop = el('chain-pop');
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
  let chainTok = 0;
  let toastTok = 0;
  let kickTok = 0;
  let nadeQueued = false;

  const keys = { u: false, d: false, l: false, r: false, fire: false, nade: false };
  const demo = { u: false, d: false, l: false, r: false, fire: true, nade: false };
  const pointer = { down: false, x: VW * 0.5, y: VH - 140, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const embers = [];

  function playing() {
    return G.mode === 'play';
  }
  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }
  function overlayBlocksPlay() {
    return overlayOpen() && G.mode !== 'play';
  }
  function inL() {
    return G.mode === 'title' ? demo.l : keys.l;
  }
  function inR() {
    return G.mode === 'title' ? demo.r : keys.r;
  }
  function inU() {
    return G.mode === 'title' ? demo.u : keys.u;
  }
  function inD() {
    return G.mode === 'title' ? demo.d : keys.d;
  }
  function fireHeld() {
    if (G.mode === 'title') return demo.fire;
    if (overlayBlocksPlay()) return false;
    return keys.fire || pointer.down;
  }
  function nadeHeld() {
    if (G.mode === 'title') return demo.nade;
    if (overlayBlocksPlay()) return false;
    return keys.nade || nadeQueued;
  }
  function sx(x) {
    return ox + x * scale;
  }
  function sy(y) {
    return oy + y * scale;
  }

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
    if (!playing() || n <= 0) return;
    G.score += n;
    if (scoreEl) scoreEl.textContent = String(G.score);
    saveBest();
    if (G.score >= G.nextLife && G.lives < LIFE_CAP) {
      G.lives += 1;
      G.nextLife += LIFE_EVERY;
      toast('1UP', false, true);
      audio.oneup();
      syncPips();
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
  function toast(msg, warn, gold) {
    G.toastT = 1.35;
    toastTok += 1;
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold);
    toastEl.classList.remove('hidden');
    const tok = toastTok;
    setTimeout(function () {
      if (tok === toastTok) toastEl.classList.add('hidden');
    }, 1350);
  }
  function setHint(text, cls) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', cls === 'hot');
    hintEl.classList.toggle('warn', cls === 'warn');
  }
  function syncPips() {
    if (!pipsEl) return;
    const n = Math.max(LIVES, G.lives);
    while (pips.length < n) {
      const node = document.createElement('span');
      node.className = 'pip';
      pipsEl.appendChild(node);
      pips.push(node);
    }
    while (pips.length > n) {
      const node = pips.pop();
      if (node && node.parentNode) node.parentNode.removeChild(node);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].classList.toggle('on', i < G.lives);
      pips[i].classList.toggle('gone', i >= G.lives && G.mode !== 'title');
    }
  }
  function syncModes() {
    const d = isDense();
    if (modeRaid) modeRaid.setAttribute('aria-pressed', d ? 'false' : 'true');
    if (modeDense) modeDense.setAttribute('aria-pressed', d ? 'true' : 'false');
  }
  function gunName() {
    return G.spreadT > 0 ? '散弹' : '步枪';
  }
  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    const spec = STAGES[G.stage - 1] || STAGES[0];
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '林道';
      else if (G.boss && G.boss.active && !G.boss.dead) stageLabel.textContent = spec.boss;
      else stageLabel.textContent = spec.name;
      stageLabel.classList.toggle('hot', G.stage >= 3 || (G.boss && G.boss.active));
    }
    if (tagLabel) {
      tagLabel.textContent = isDense() ? '密林' : '佣兵';
      tagLabel.classList.toggle('warn', isDense() || G.mode === 'lose' || G.lives === 1);
      tagLabel.classList.toggle('hot', !isDense() && G.stage >= 3);
    }
    if (gunLabel) {
      gunLabel.textContent = gunName();
      gunLabel.classList.toggle('hot', G.spreadT > 0);
    }
    if (nadeLabel) {
      nadeLabel.textContent = '雷 ' + G.nades;
      nadeLabel.classList.toggle('low', G.nades <= 1);
    }
    if (bossWrap) {
      const on = !!(G.boss && G.boss.active && !G.boss.dead && G.mode !== 'title');
      bossWrap.hidden = !on;
      if (on) {
        if (bossName) bossName.textContent = spec.boss;
        if (bossBar) {
          const v = clamp(G.boss.hp / G.boss.max, 0, 1);
          bossBar.style.transform = 'scaleX(' + v + ')';
          bossBar.classList.toggle('low', v < 0.32);
          bossBar.classList.toggle('hot', v > 0.7);
        }
      }
    }
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && playing());
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 手雷越碉 · 救人补雷', 'warn');
    else if (G.mode === 'win') setHint('据点捣毁 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 手雷砸碉 · 别硬撞', 'warn');
    else if (G.boss && G.boss.active && !G.boss.dead) setHint('头目 · ' + spec.boss + ' · 手雷砸甲', 'hot');
    else if (G.spreadT > 0) setHint('散弹三向 · 手雷仍可越碉', 'hot');
    else if (G.nades <= 1) setHint('雷将尽 · 救人补雷', 'warn');
    else setHint('八向走射 · 手雷越碉 · 救人补雷', '');
    syncPips();
    syncModes();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.classList.toggle('end', kind === 'win' || kind === 'lose');
    overlay.setAttribute('aria-hidden', 'false');
    if (panel) {
      panel.classList.toggle('win', kind === 'win');
      panel.classList.toggle('lose', kind === 'lose');
    }
    if (ovKicker) {
      ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'MRCS';
    }
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.textContent = lead;
    if (ovOps) ovOps.textContent = kind === 'title' ? OPS : 'R 重开随时可用';
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = '换模式';
  }
  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (canvas && canvas.focus) canvas.focus({ preventScroll: true });
  }

  function hitStop(sec) {
    if (REDUCE || G.mode === 'title') return;
    G.stop = Math.max(G.stop, sec);
  }
  function kick(mag, cls) {
    if (REDUCE || G.mode === 'title') return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.05, mag * 0.007));
    if (!stageEl) return;
    const c = cls || (mag >= 6 ? 'die' : mag >= 3.4 ? 'boom' : 'hit');
    kickTok += 1;
    stageEl.classList.remove('die', 'boom', 'hit', 'thump', 'pickup', 'win-flash');
    void stageEl.offsetWidth;
    stageEl.classList.add(c);
    const tok = kickTok;
    setTimeout(function () {
      if (tok === kickTok && stageEl) {
        stageEl.classList.remove('die', 'boom', 'hit', 'thump', 'pickup', 'win-flash');
      }
    }, 380);
  }
  function screenFlash(rgb, a) {
    G.flash = Math.max(G.flash, a || 0.4);
    G.flashRgb = rgb;
  }
  function emit(n, spec) {
    if (REDUCE) n = Math.min(n, 6);
    for (let i = 0; i < n; i++) {
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
    capArr(particles, 280);
  }
  function popSpark(x, y, rgb, rad) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb, rad: rad || 16 });
    rings.push({ x: x, y: y, t: 0, rgb: rgb, r: rad || 14 });
    capArr(sparks, 40);
    capArr(rings, 24);
  }
  function floatText(x, y, text, rgb, gold) {
    floats.push({
      x: x, y: y, text: text, rgb: rgb,
      t: 0, life: gold ? 0.95 : 0.68,
      size: gold ? 20 : 15, gold: !!gold, vy: gold ? 90 : 72
    });
    capArr(floats, 28);
  }
  function boomAt(x, y, power, rgb) {
    const p = power || 1;
    emit(10 + (p * 12) | 0, {
      x: x, y: y, j: 8 + p * 6,
      vx0: -240 * p, vx1: 240 * p, vy0: -280 * p, vy1: 80 * p,
      life: 0.32 + p * 0.16, r0: 1.2, r1: 3.4 + p, rgb: rgb || HOT, g: 220
    });
    popSpark(x, y, rgb || HOT, 12 + p * 12);
    screenFlash(rgb || HOT, 0.16 + p * 0.1);
    kick(2.4 + p * 2.6);
  }
  function showChain(n) {
    if (!chainPop || REDUCE) return;
    chainTok += 1;
    const tok = chainTok;
    chainPop.textContent = '×' + n;
    chainPop.classList.remove('hidden');
    chainPop.style.animation = 'none';
    void chainPop.offsetWidth;
    chainPop.style.animation = '';
    setTimeout(function () {
      if (tok === chainTok && chainPop) chainPop.classList.add('hidden');
    }, 700);
  }
  function bumpCombo() {
    if (!playing()) return;
    G.combo += 1;
    G.comboT = COMBO_WIN;
    if (G.combo > G.maxCombo) G.maxCombo = G.combo;
    const prev = G.mult;
    G.mult = 1 + Math.min(4, Math.floor((G.combo - 1) / 3));
    if (G.combo >= 2) showChain(G.combo);
    if (G.mult > prev) {
      audio.combo(G.mult);
      hitStop(0.04);
      if (comboBox) {
        comboBox.classList.remove('hot');
        void comboBox.offsetWidth;
        comboBox.classList.add('hot');
      }
    }
    if (G.combo % 3 === 0) {
      const p = G.player;
      if (p) floatText(p.x, p.y - 40, G.combo + ' 链', GOLD, true);
      hitStop(0.034);
    }
    syncHud();
  }

  function seedEmbers() {
    embers.length = 0;
    for (let i = 0; i < 72; i++) {
      embers.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        s: rand(0.5, 2.1),
        a: rand(0.12, 0.5),
        z: rand(0.35, 1.2),
        leaf: Math.random() < 0.55
      });
    }
  }

  function makePlayer() {
    return {
      x: VW * 0.5,
      y: VH - 148,
      vx: 0,
      vy: 0,
      ax: 0,
      ay: -1,
      r: HIT_R,
      run: 0
    };
  }

  function makeEnemy(kind, x, y, extra) {
    const e = {
      kind: kind,
      x: x,
      y: y,
      vx: 0,
      vy: kind === 'grunt' ? 28 : kind === 'runner' ? 86 : 0,
      hp: Math.max(1, Math.round(hpOf(kind) * (kind === 'bunker' || kind === 'jeep' ? hpMul() : 1))),
      r: rOf(kind),
      w: kind === 'bunker' ? 38 : kind === 'jeep' ? 42 : 22,
      h: kind === 'bunker' ? 22 : kind === 'jeep' ? 20 : 20,
      alive: true,
      t: 0,
      fire: rand(0.2, 0.9),
      flash: 0,
      score: scoreOf(kind),
      dir: extra && extra.dir != null ? extra.dir : (Math.random() < 0.5 ? -1 : 1),
      lane: extra && extra.lane != null ? extra.lane : 0
    };
    if (kind === 'jeep') e.vx = e.dir * 90;
    return e;
  }

  function makeBoss(spec) {
    return {
      name: spec.boss,
      kind: spec.theme,
      x: VW * 0.5,
      y: -50,
      vx: 70,
      r: spec.theme === 'base' ? 28 : 24,
      hp: Math.round(spec.hp * hpMul()),
      max: Math.round(spec.hp * hpMul()),
      active: false,
      dead: false,
      t: 0,
      fire: 0.6,
      flash: 0,
      state: 'idle',
      enter: 0
    };
  }

  function loadStage(n, attract) {
    G.stage = n;
    G.stageT = 0;
    G.waveI = 0;
    G.enemies.length = 0;
    G.shots.length = 0;
    G.nadeshots.length = 0;
    G.pickups.length = 0;
    G.scroll = 0;
    G.winT = 0;
    G.deadT = 0;
    G.fireCd = 0;
    G.nadeCd = 0;
    G.muzzle = 0;
    G.player = makePlayer();
    G.boss = makeBoss(STAGES[n - 1]);
    G.invuln = attract ? 0 : 0.8;
    if (attract) {
      spawnEnemy(makeEnemy('grunt', 160, 80));
      spawnEnemy(makeEnemy('grunt', 320, 40));
      spawnEnemy(makeEnemy('bunker', 240, 160));
      spawnEnemy(makeEnemy('runner', 200, -10));
    }
  }

  function liveEnemies() {
    let n = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive) n += 1;
    }
    return n;
  }

  function spawnEnemy(e) {
    G.enemies.push(e);
    capArr(G.enemies, 48);
  }

  function spawnWave(w) {
    const lane = function (i, total) {
      const t = total <= 1 ? 0.5 : i / (total - 1);
      return lerp(WALL_L + 46, WALL_R - 46, t);
    };
    const extra = isDense() ? 2 : 0;
    let i;
    let n;
    if (w.kind === 'grunts') {
      n = (w.n || 5) + extra;
      for (i = 0; i < n; i++) {
        spawnEnemy(makeEnemy('grunt', lane(i, n) + rand(-12, 12), -20 - i * 18));
      }
    } else if (w.kind === 'runners') {
      n = (w.n || 3) + (isDense() ? 1 : 0);
      for (i = 0; i < n; i++) {
        spawnEnemy(makeEnemy('runner', lane(i, n), -16 - i * 22));
      }
    } else if (w.kind === 'bunkers') {
      const xs = isDense() ? [140, 240, 340] : [170, 310];
      for (i = 0; i < xs.length; i++) {
        spawnEnemy(makeEnemy('bunker', xs[i] + rand(-8, 8), 70 + i * 8));
      }
    } else if (w.kind === 'snipers') {
      n = (w.n || 2) + (isDense() ? 1 : 0);
      for (i = 0; i < n; i++) {
        spawnEnemy(makeEnemy('sniper', lane(i, n), 40 + i * 24));
      }
    } else if (w.kind === 'jeep') {
      spawnEnemy(makeEnemy('jeep', w.dir === -1 ? WALL_R - 40 : WALL_L + 40, 90, { dir: w.dir || 1 }));
    } else if (w.kind === 'pow') {
      spawnEnemy(makeEnemy('pow', rand(WALL_L + 70, WALL_R - 70), 50));
    } else if (w.kind === 'mix1') {
      spawnEnemy(makeEnemy('bunker', 240, 80));
      spawnEnemy(makeEnemy('grunt', 150, -10));
      spawnEnemy(makeEnemy('grunt', 330, -10));
      spawnEnemy(makeEnemy('runner', 240, -40));
    } else if (w.kind === 'mix2') {
      spawnEnemy(makeEnemy('bunker', 160, 70));
      spawnEnemy(makeEnemy('bunker', 320, 90));
      spawnEnemy(makeEnemy('sniper', 240, 40));
      spawnEnemy(makeEnemy('runner', 200, -20));
      spawnEnemy(makeEnemy('runner', 280, -30));
    } else if (w.kind === 'mix3') {
      spawnEnemy(makeEnemy('bunker', 140, 60));
      spawnEnemy(makeEnemy('bunker', 240, 90));
      spawnEnemy(makeEnemy('bunker', 340, 60));
      spawnEnemy(makeEnemy('jeep', WALL_L + 40, 130, { dir: 1 }));
      spawnEnemy(makeEnemy('sniper', 200, 30));
      spawnEnemy(makeEnemy('runner', 300, -20));
    } else if (w.kind === 'boss') {
      activateBoss();
    }
  }

  function coverAt(x, y, z, skip) {
    if ((z || 0) > 10) return null;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive || !isCover(e.kind) || e === skip) continue;
      if (Math.abs(x - e.x) < e.w * 0.5 && Math.abs(y - e.y) < e.h * 0.5) return e;
    }
    return null;
  }

  function resolveBunkerPush(p) {
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive || !isCover(e.kind)) continue;
      const hx = e.w * 0.5 + p.r - 1;
      const hy = e.h * 0.5 + p.r - 1;
      const dx = p.x - e.x;
      const dy = p.y - e.y;
      if (Math.abs(dx) < hx && Math.abs(dy) < hy) {
        const oxp = hx - Math.abs(dx);
        const oyp = hy - Math.abs(dy);
        if (oxp < oyp) p.x = e.x + (dx < 0 ? -hx : hx);
        else p.y = e.y + (dy < 0 ? -hy : hy);
      }
    }
  }

  function countPShots() {
    let n = 0;
    for (let i = 0; i < G.shots.length; i++) {
      if (G.shots[i].from === 'p') n += 1;
    }
    return n;
  }

  function spawnShot(s) {
    G.shots.push(s);
    capArr(G.shots, 80);
  }

  function enemyShoot(e, dx, dy, spd, kind) {
    const len = hypot(dx, dy) || 1;
    const nx = dx / len;
    const ny = dy / len;
    const oxp = isCover(e.kind) ? nx * (e.w * 0.55 + 6) : nx * (e.r + 4);
    const oyp = isCover(e.kind) ? ny * (e.h * 0.55 + 6) : ny * (e.r + 4);
    spawnShot({
      x: e.x + oxp,
      y: e.y + oyp,
      vx: nx * spd,
      vy: ny * spd,
      r: kind === 'heavy' ? 4.4 : 3.2,
      from: 'e',
      kind: kind || 'pellet',
      z: 0,
      owner: e
    });
  }

  function tryShoot() {
    if (G.fireCd > 0 || G.deadT > 0) return;
    if (countPShots() >= MAX_PSHOT && G.spreadT <= 0) return;
    const p = G.player;
    const ax = p.ax;
    const ay = p.ay;
    const spread = G.spreadT > 0;
    const n = spread ? 3 : 1;
    const base = Math.atan2(ay, ax);
    for (let i = 0; i < n; i++) {
      const a = spread ? base + (i - 1) * 0.22 : base;
      spawnShot({
        x: p.x + Math.cos(a) * 16,
        y: p.y + Math.sin(a) * 16,
        vx: Math.cos(a) * SHOT_SPD,
        vy: Math.sin(a) * SHOT_SPD,
        r: spread ? 3.6 : 3.1,
        from: 'p',
        kind: spread ? 'spread' : 'rifle',
        z: 0,
        dmg: 1
      });
    }
    G.fireCd = fireRate();
    G.muzzle = 0.06;
    if (spread) audio.spread();
    else audio.shot();
    emit(3, {
      x: p.x + ax * 18, y: p.y + ay * 18, j: 3,
      vx0: ax * 40, vx1: ax * 90, vy0: ay * 40, vy1: ay * 90,
      life: 0.12, r0: 1, r1: 2.2, rgb: GOLD, g: 40
    });
  }

  function tryNade() {
    nadeQueued = false;
    if (G.nadeCd > 0 || G.deadT > 0) return;
    if (G.nades <= 0) {
      G.nadeCd = 0.55;
      if (playing()) toast('没雷了', true, false);
      return;
    }
    const p = G.player;
    const ax = p.ax;
    const ay = p.ay;
    if (playing()) G.nades -= 1;
    G.nadeCd = NADE_CD;
    G.nadeshots.push({
      x: p.x + ax * 10,
      y: p.y + ay * 10,
      vx: ax * NADE_SPD,
      vy: ay * NADE_SPD,
      z: 6,
      vz: NADE_VZ,
      from: 'p',
      kind: 'nade'
    });
    capArr(G.nadeshots, 6);
    audio.nade();
    syncHud();
  }

  function die(why) {
    if (!playing() || G.deadT > 0 || G.invuln > 0) return;
    G.why = why || 'hit';
    G.deadT = DIE_T;
    G.lives -= 1;
    G.combo = 0;
    G.mult = 1;
    G.comboT = 0;
    G.spreadT = 0;
    audio.death();
    boomAt(G.player.x, G.player.y, 1.6, MAG);
    hitStop(0.072);
    kick(7.2, 'die');
    screenFlash(MAG, 0.55);
    syncHud();
    if (G.lives <= 0) {
      G.mode = 'lose';
      const map = {
        crash: '撞上了',
        shot: '中弹了',
        crush: '被碾了'
      };
      showOverlay('lose', map[G.why] || '倒在林里了', '命尽。R 立刻重开。手雷越过碉堡，救人补雷。');
      audio.lose();
    }
  }

  function respawn() {
    G.player = makePlayer();
    G.deadT = 0;
    G.invuln = INVULN;
    G.fireCd = 0.1;
    G.spreadT = 0;
    for (let i = G.shots.length - 1; i >= 0; i--) {
      if (G.shots[i].from === 'e') G.shots.splice(i, 1);
    }
    screenFlash(HOT, 0.22);
    syncHud();
  }

  function giveNades(n) {
    G.nades = clamp(G.nades + n, 0, NADE_MAX);
    syncHud();
  }

  function dropPickup(x, y, chance, kind) {
    if (!playing()) return;
    if (Math.random() > (chance || 0.16)) return;
    G.pickups.push({
      x: x, y: y, t: 0, life: 7.2, kind: kind || (Math.random() < 0.55 ? 'nade' : 'spread')
    });
    capArr(G.pickups, 6);
  }

  function hurtEnemy(e, dmg, shot) {
    if (!e.alive) return;
    if (e.kind === 'pow') {
      rescuePow(e);
      return;
    }
    e.hp -= dmg;
    e.flash = 0.08;
    bumpCombo();
    audio.hit(G.combo);
    hitStop(shot && shot.kind === 'nade' ? 0.05 : 0.032);
    kick(shot && shot.kind === 'nade' ? 2.8 : 1.8, 'hit');
    emit(6, {
      x: e.x, y: e.y, j: 5,
      vx0: -120, vx1: 120, vy0: -140, vy1: 40,
      life: 0.22, r0: 1.1, r1: 2.6, rgb: shot && shot.kind === 'nade' ? GOLD : HOT, g: 160
    });
    if (e.hp <= 0) {
      e.alive = false;
      addScore((e.score || 80) * G.mult);
      boomAt(e.x, e.y, e.kind === 'bunker' || e.kind === 'jeep' ? 1.1 : 0.7, e.kind === 'bunker' ? MUD : HOT);
      floatText(e.x, e.y - 10, '+' + ((e.score || 80) * G.mult), HOT, G.mult >= 2);
      if (e.kind === 'jeep') dropPickup(e.x, e.y, 0.85, 'spread');
      else if (e.kind === 'bunker' || e.kind === 'sniper') dropPickup(e.x, e.y, 0.32);
      else dropPickup(e.x, e.y, 0.1);
    }
  }

  function rescuePow(e) {
    if (!e.alive) return;
    e.alive = false;
    if (!playing()) return;
    giveNades(2);
    bumpCombo();
    addScore(SCORE.pow * G.mult);
    audio.rescue();
    toast('救人 +雷', false, true);
    floatText(e.x, e.y - 14, '救 +2雷', GOLD, true);
    popSpark(e.x, e.y, GOLD, 22);
    kick(2.6, 'pickup');
    screenFlash(GOLD, 0.28);
  }

  function hurtBoss(dmg, shot) {
    const b = G.boss;
    if (!b || !b.active || b.dead) return;
    const nade = shot && shot.kind === 'nade';
    b.hp -= nade ? dmg + 2 : dmg;
    b.flash = 0.09;
    bumpCombo();
    audio.hit(G.combo);
    hitStop(nade ? 0.055 : 0.05);
    kick(3.1, 'hit');
    emit(8, {
      x: b.x, y: b.y, j: 10,
      vx0: -160, vx1: 160, vy0: -120, vy1: 80,
      life: 0.24, r0: 1.2, r1: 3, rgb: GOLD, g: 80
    });
    syncHud();
    if (b.hp <= 0) {
      b.dead = true;
      b.active = false;
      addScore(SCORE.boss * G.mult);
      addScore(SCORE.stage * G.stage * G.mult);
      boomAt(b.x, b.y, 2.4, GOLD);
      audio.boom();
      hitStop(0.08);
      kick(6.4, 'boom');
      screenFlash(GOLD, 0.5);
      toast(b.name + ' 击破', false, true);
      G.winT = 1.35;
      dropPickup(b.x, b.y, 1, 'nade');
    }
  }

  function explodeNade(n) {
    audio.boom();
    boomAt(n.x, n.y, 1.35, GOLD);
    hitStop(0.046);
    floatText(n.x, n.y - 8, '爆', GOLD, true);
    let i;
    for (i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      if (hypot(e.x - n.x, e.y - n.y) <= NADE_R + e.r) {
        if (e.kind === 'pow') rescuePow(e);
        else hurtEnemy(e, 4, n);
      }
    }
    const b = G.boss;
    if (b && b.active && !b.dead && hypot(b.x - n.x, b.y - n.y) <= NADE_R + b.r) {
      hurtBoss(3, n);
    }
  }

  function nextStage() {
    if (G.stage >= STAGES.length) {
      G.mode = 'win';
      const bonus = isDense() ? 10000 : 8000;
      addScore(bonus);
      audio.win();
      kick(4, 'win-flash');
      showOverlay(
        'win',
        isDense() ? '密林通关' : '据点捣毁了',
        '最高连击 ×' + G.maxCombo + ' · 再加 ' + bonus
      );
      syncHud();
      return;
    }
    G.stage += 1;
    const keepNades = G.nades;
    const keepSpread = G.spreadT;
    loadStage(G.stage, false);
    G.nades = keepNades;
    G.spreadT = keepSpread;
    audio.stage();
    toast(STAGES[G.stage - 1].name, false, true);
    G.invuln = 1.0;
    syncHud();
  }

  function activateBoss() {
    const b = G.boss;
    if (!b || b.active || b.dead) return;
    b.active = true;
    b.state = 'enter';
    b.enter = 1.15;
    b.y = -40;
    audio.boss();
    toast(b.name, false, true);
    kick(3.6, 'thump');
    syncHud();
  }

  function clientToWorld(cx, cy) {
    if (!canvas) return { x: VW * 0.5, y: VH - 140 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: clamp((cx - rect.left - ox) / scale, 0, VW),
      y: clamp((cy - rect.top - oy) / scale, 0, VH)
    };
  }

  function demoThink() {
    const p = G.player;
    if (!p) return;
    demo.fire = true;
    demo.u = p.y > VH - 200;
    demo.d = p.y < VH - 280;
    const sway = Math.sin(G.clock * 0.85);
    demo.l = sway > 0.18;
    demo.r = sway < -0.18;
    demo.nade = false;
    let i;
    for (i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive || !isCover(e.kind)) continue;
      const dx = e.x - p.x;
      const dy = e.y - p.y;
      if (dy > -90 && dy < 10 && Math.abs(dx) < 70) demo.nade = true;
    }
    if (liveEnemies() < 3) {
      spawnEnemy(makeEnemy('grunt', rand(WALL_L + 50, WALL_R - 50), -20));
    }
  }

  function updatePlayer(dt) {
    if (G.deadT > 0) {
      G.deadT -= dt;
      if (G.deadT <= 0 && G.lives > 0 && playing()) respawn();
      return;
    }
    const p = G.player;
    if (!p) return;
    let ix = 0;
    let iy = 0;
    if (inL()) ix -= 1;
    if (inR()) ix += 1;
    if (inU()) iy -= 1;
    if (inD()) iy += 1;
    if (pointer.down && playing() && !overlayBlocksPlay()) {
      const dx = pointer.x - p.x;
      const dy = pointer.y - p.y;
      if (hypot(dx, dy) > 10) {
        ix = dx;
        iy = dy;
      }
    }
    const len = hypot(ix, iy);
    const spd = WALK * (isDense() ? 1.08 : 1);
    if (len > 0.001) {
      p.ax = ix / len;
      p.ay = iy / len;
      p.vx = p.ax * spd;
      p.vy = p.ay * spd;
      p.run += dt * 14;
    } else {
      p.vx *= 0.2;
      p.vy *= 0.2;
    }
    p.x = clamp(p.x + p.vx * dt, WALL_L + 14, WALL_R - 14);
    p.y = clamp(p.y + p.vy * dt, 86, 664);
    resolveBunkerPush(p);
    p.x = clamp(p.x, WALL_L + 14, WALL_R - 14);
    p.y = clamp(p.y, 86, 664);

    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.nadeCd > 0) G.nadeCd -= dt;
    if (G.muzzle > 0) G.muzzle -= dt;
    if (G.spreadT > 0) G.spreadT -= dt;
    if (fireHeld()) tryShoot();
    if (nadeHeld()) tryNade();

    if (G.invuln > 0 || G.mode === 'title') return;
    let i;
    for (i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      if (e.kind === 'pow') {
        if (hypot(e.x - p.x, e.y - p.y) < e.r + p.r) rescuePow(e);
        continue;
      }
      if (isCover(e.kind)) continue;
      if (hypot(e.x - p.x, e.y - p.y) < e.r + p.r - 2) {
        die(e.kind === 'jeep' ? 'crush' : 'crash');
        return;
      }
    }
    const b = G.boss;
    if (b && b.active && !b.dead && hypot(b.x - p.x, b.y - p.y) < b.r + p.r - 2) {
      die('crash');
    }
  }

  function updateEnemy(e, dt) {
    if (!e.alive) {
      if (e.flash > 0) e.flash -= dt;
      return;
    }
    e.t += dt;
    if (e.flash > 0) e.flash -= dt;
    const p = G.player;
    const scr = scrollSpd();

    if (e.kind === 'grunt') {
      e.y += (e.vy + scr) * dt;
      e.x += Math.sin(e.t * 2.2 + e.lane) * 18 * dt;
      e.fire -= dt;
      if (e.fire <= 0 && p && G.deadT <= 0) {
        e.fire = (1.15 + Math.random() * 0.55) * eFireMul();
        enemyShoot(e, p.x - e.x, p.y - e.y, 210, 'pellet');
      }
    } else if (e.kind === 'runner') {
      if (p) {
        const dx = p.x - e.x;
        const dy = p.y - e.y;
        const len = hypot(dx, dy) || 1;
        e.x += (dx / len) * 110 * spdMul() * 0.55 * dt;
        e.y += (dy / len) * 130 * dt + scr * 0.4 * dt;
      } else {
        e.y += (90 + scr) * dt;
      }
    } else if (e.kind === 'bunker') {
      e.y += scr * dt;
      e.fire -= dt;
      if (e.fire <= 0 && p && G.deadT <= 0) {
        e.fire = (0.95 + Math.random() * 0.4) * eFireMul();
        enemyShoot(e, p.x - e.x, p.y - e.y, 240, 'pellet');
      }
    } else if (e.kind === 'sniper') {
      e.y += scr * 0.85 * dt;
      e.fire -= dt;
      if (e.fire <= 0 && p && G.deadT <= 0) {
        e.fire = (1.35 + Math.random() * 0.4) * eFireMul();
        enemyShoot(e, p.x - e.x, p.y - e.y, 320, 'heavy');
      }
    } else if (e.kind === 'jeep') {
      e.x += e.vx * dt;
      e.y += scr * 0.45 * dt;
      if (e.x < WALL_L + 30 || e.x > WALL_R - 30) e.vx *= -1;
      e.fire -= dt;
      if (e.fire <= 0 && p && G.deadT <= 0) {
        e.fire = (0.7 + Math.random() * 0.3) * eFireMul();
        enemyShoot(e, p.x - e.x, p.y - e.y, 250, 'pellet');
        enemyShoot(e, p.x - e.x + 30, p.y - e.y, 250, 'pellet');
      }
    } else if (e.kind === 'pow') {
      e.y += scr * dt;
    }

    e.x = clamp(e.x, WALL_L + 16, WALL_R - 16);
    if (e.y > VH + 50) e.alive = false;
  }

  function updateBoss(dt) {
    const b = G.boss;
    if (!b || b.dead || !b.active) return;
    b.t += dt;
    if (b.flash > 0) b.flash -= dt;
    const p = G.player;
    if (b.state === 'enter') {
      b.enter -= dt;
      b.y = lerp(b.y, 118, 1 - Math.pow(0.002, dt));
      if (b.enter <= 0) b.state = 'fight';
      return;
    }
    b.y = lerp(b.y, 118 + Math.sin(b.t * 1.4) * 18, 0.08);
    if (b.kind === 'jungle') {
      b.x += b.vx * dt;
      if (b.x < WALL_L + 50 || b.x > WALL_R - 50) b.vx *= -1;
    } else if (b.kind === 'river') {
      b.x = VW * 0.5 + Math.sin(b.t * 0.9) * 120;
    } else {
      b.x = VW * 0.5 + Math.sin(b.t * 1.1) * 140;
      b.y = 130 + Math.cos(b.t * 0.8) * 36;
    }
    b.x = clamp(b.x, WALL_L + 40, WALL_R - 40);
    b.fire -= dt;
    if (b.fire > 0 || !p || G.deadT > 0) return;
    const low = b.hp / b.max < 0.42;
    if (b.kind === 'jungle') {
      b.fire = (low ? 0.55 : 0.82) * eFireMul();
      enemyShoot(b, -0.4, 1, 220, 'pellet');
      enemyShoot(b, 0, 1, 240, 'pellet');
      enemyShoot(b, 0.4, 1, 220, 'pellet');
    } else if (b.kind === 'river') {
      b.fire = (low ? 0.48 : 0.7) * eFireMul();
      enemyShoot(b, p.x - b.x, p.y - b.y, 280, 'heavy');
      if (low) {
        enemyShoot(b, p.x - b.x - 40, p.y - b.y, 250, 'pellet');
        enemyShoot(b, p.x - b.x + 40, p.y - b.y, 250, 'pellet');
      }
    } else {
      b.fire = (low ? 0.42 : 0.64) * eFireMul();
      const n = low ? 8 : 5;
      for (let i = 0; i < n; i++) {
        const a = -1.2 + (i / (n - 1)) * 2.4;
        enemyShoot(b, Math.sin(a), Math.cos(a), 230, i % 2 ? 'heavy' : 'pellet');
      }
      if (low && liveEnemies() < 6) {
        spawnEnemy(makeEnemy('grunt', b.x + rand(-40, 40), b.y + 30));
      }
    }
  }

  function updateShots(dt) {
    let i;
    for (i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.x < -20 || s.x > VW + 20 || s.y < -30 || s.y > VH + 30) {
        G.shots.splice(i, 1);
        continue;
      }
      const cov = coverAt(s.x, s.y, s.z, s.owner);
      if (cov) {
        if (s.from === 'p') hurtEnemy(cov, s.dmg || 1, s);
        G.shots.splice(i, 1);
        emit(3, {
          x: s.x, y: s.y, j: 3,
          vx0: -40, vx1: 40, vy0: -50, vy1: 20,
          life: 0.14, r0: 1, r1: 2, rgb: MUD, g: 80
        });
        continue;
      }
      if (s.from === 'p') {
        let hit = false;
        for (let j = 0; j < G.enemies.length; j++) {
          const e = G.enemies[j];
          if (!e.alive || isCover(e.kind)) continue;
          if (hypot(e.x - s.x, e.y - s.y) < e.r + s.r) {
            hurtEnemy(e, s.dmg || 1, s);
            hit = true;
            break;
          }
        }
        if (!hit && G.boss && G.boss.active && !G.boss.dead) {
          if (hypot(G.boss.x - s.x, G.boss.y - s.y) < G.boss.r + s.r) {
            hurtBoss(s.dmg || 1, s);
            hit = true;
          }
        }
        if (hit) {
          G.shots.splice(i, 1);
          continue;
        }
      } else if (playing() && G.deadT <= 0 && G.invuln <= 0 && G.player) {
        const p = G.player;
        if (hypot(p.x - s.x, p.y - s.y) < p.r + s.r - 1) {
          G.shots.splice(i, 1);
          die('shot');
          continue;
        }
      }
    }
  }

  function updateNades(dt) {
    let i;
    for (i = G.nadeshots.length - 1; i >= 0; i--) {
      const n = G.nadeshots[i];
      n.x += n.vx * dt;
      n.y += n.vy * dt;
      n.vz -= NADE_G * dt;
      n.z += n.vz * dt;
      n.x = clamp(n.x, WALL_L + 8, WALL_R - 8);
      let pop = n.z <= 0 || n.y < -20 || n.y > VH + 20;
      if (!pop && n.z < 16) {
        for (let j = 0; j < G.enemies.length; j++) {
          const e = G.enemies[j];
          if (!e.alive) continue;
          if (hypot(e.x - n.x, e.y - n.y) < e.r + 8) {
            pop = true;
            break;
          }
        }
        if (!pop && G.boss && G.boss.active && !G.boss.dead) {
          if (hypot(G.boss.x - n.x, G.boss.y - n.y) < G.boss.r + 8) pop = true;
        }
      }
      if (pop) {
        n.z = 0;
        explodeNade(n);
        G.nadeshots.splice(i, 1);
      }
    }
  }

  function updatePickups(dt) {
    const p = G.player;
    for (let i = G.pickups.length - 1; i >= 0; i--) {
      const u = G.pickups[i];
      u.t += dt;
      u.y += scrollSpd() * 0.35 * dt;
      if (u.t > u.life || u.y > VH + 20) {
        G.pickups.splice(i, 1);
        continue;
      }
      if (!playing() || G.deadT > 0 || !p) continue;
      if (hypot(u.x - p.x, u.y - p.y) < 18) {
        if (u.kind === 'spread') {
          G.spreadT = SPREAD_T;
          toast('散弹', false, true);
          floatText(u.x, u.y - 12, '散弹', CYN, true);
        } else {
          giveNades(1);
          toast('手雷 +1', false, true);
          floatText(u.x, u.y - 12, '+雷', GOLD, true);
        }
        audio.pickup();
        kick(2.2, 'pickup');
        screenFlash(u.kind === 'spread' ? CYN : GOLD, 0.22);
        G.pickups.splice(i, 1);
      }
    }
  }

  function updateWaves(dt) {
    if (G.boss && G.boss.active) return;
    if (G.winT > 0) return;
    G.stageT += dt;
    const spec = STAGES[G.stage - 1];
    while (G.waveI < spec.waves.length && G.stageT >= spec.waves[G.waveI].t) {
      spawnWave(spec.waves[G.waveI]);
      G.waveI += 1;
    }
  }

  function updateFx(dt) {
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.punch > 1) G.punch = Math.max(1, G.punch - dt * 0.35);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 1.8);
    if (G.toastT > 0) G.toastT -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
        syncHud();
      }
    }
    if (G.invuln > 0) G.invuln -= dt;
    let i;
    for (i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vy += (p.g || 280) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.28) sparks.splice(i, 1);
    }
    for (i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.42) rings.splice(i, 1);
    }
    for (i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y -= f.vy * dt;
      if (f.t > f.life) floats.splice(i, 1);
    }
    const scr = scrollSpd();
    for (i = 0; i < embers.length; i++) {
      const em = embers[i];
      em.y += scr * em.z * dt;
      if (em.y > VH + 8) {
        em.y = -8;
        em.x = Math.random() * VW;
      }
    }
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    if (G.mode === 'title') demoThink();
    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt);
      return;
    }
    G.scroll += scrollSpd() * dt;
    updatePlayer(dt);
    let i;
    for (i = 0; i < G.enemies.length; i++) updateEnemy(G.enemies[i], dt);
    updateBoss(dt);
    updateShots(dt);
    updateNades(dt);
    updatePickups(dt);
    if (playing() || G.mode === 'title') updateWaves(dt);
    if (G.winT > 0 && playing()) {
      G.winT -= dt;
      if (G.winT <= 0) nextStage();
    }
    updateFx(dt);
    G.enemies = G.enemies.filter(function (e) { return e.alive || e.flash > 0; });
    if ((G.t * 8 | 0) !== ((G.t - dt) * 8 | 0)) syncHud();
  }

  function drawSky() {
    const spec = STAGES[G.stage - 1] || STAGES[0];
    const g = ctx.createLinearGradient(ox, oy, ox, oy + VH * scale);
    if (spec.theme === 'river') {
      g.addColorStop(0, '#1a1408');
      g.addColorStop(0.5, '#12100a');
      g.addColorStop(1, '#0c0a06');
    } else if (spec.theme === 'base') {
      g.addColorStop(0, '#1c1008');
      g.addColorStop(0.45, '#140c06');
      g.addColorStop(1, '#100804');
    } else {
      g.addColorStop(0, '#1a1808');
      g.addColorStop(0.55, '#121006');
      g.addColorStop(1, '#0e0a04');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);
  }

  function drawBackdrop() {
    const spec = STAGES[G.stage - 1] || STAGES[0];
    const par = G.scroll;
    let i;
    ctx.fillStyle = spec.theme === 'base' ? 'rgba(36, 22, 12, 0.95)' : 'rgba(18, 36, 12, 0.92)';
    ctx.fillRect(ox, oy, WALL_L * scale, VH * scale);
    ctx.fillRect(sx(WALL_R), oy, (VW - WALL_R) * scale, VH * scale);
    ctx.fillStyle = rgba(HOT, 0.22);
    ctx.fillRect(sx(WALL_L - 3), oy, 3 * scale, VH * scale);
    ctx.fillRect(sx(WALL_R), oy, 3 * scale, VH * scale);

    for (i = 0; i < 16; i++) {
      const hsh = hash2(i * 19 + G.stage * 7);
      const yy = ((i * 86 - par * 0.55) % (VH + 80)) - 20;
      const h = 40 + hsh * 110;
      ctx.fillStyle = spec.theme === 'base'
        ? 'rgba(70, 42, 18, 0.45)'
        : spec.theme === 'river'
          ? 'rgba(28, 56, 36, 0.42)'
          : 'rgba(32, 64, 18, 0.4)';
      ctx.fillRect(ox, sy(yy), WALL_L * scale, h * scale);
      ctx.fillRect(sx(WALL_R), sy(yy + 16), (VW - WALL_R) * scale, h * 0.8 * scale);
      ctx.fillStyle = 'rgba(20, 48, 12, 0.35)';
      ctx.beginPath();
      ctx.moveTo(sx(8 + hsh * 10), sy(yy));
      ctx.lineTo(sx(20), sy(yy + h * 0.5));
      ctx.lineTo(sx(6), sy(yy + h));
      ctx.fill();
    }

    if (spec.theme === 'river') {
      for (i = 0; i < 6; i++) {
        const y = ((i * 140 - par * 0.7) % (VH + 50)) - 20;
        ctx.fillStyle = 'rgba(0, 80, 90, 0.16)';
        ctx.fillRect(sx(WALL_L + 70), sy(y), 80 * scale, 36 * scale);
      }
    }
    if (spec.theme === 'base') {
      for (i = 0; i < 8; i++) {
        const hsh = hash2(i * 11 + 3);
        const y = ((i * 110 - par * 0.4) % (VH + 60)) - 20;
        ctx.fillStyle = 'rgba(255, 154, 20, 0.06)';
        ctx.fillRect(sx(WALL_L + 18 + hsh * 40), sy(y), 12 * scale, 48 * scale);
      }
    }

    ctx.strokeStyle = rgba(HOT, spec.theme === 'base' ? 0.14 : 0.07);
    ctx.lineWidth = 1;
    for (i = 0; i < 10; i++) {
      const y = ((i * 86 - par * 0.8) % (VH + 40)) - 10;
      ctx.beginPath();
      ctx.moveTo(sx(WALL_L), sy(y));
      ctx.lineTo(sx(WALL_R), sy(y));
      ctx.stroke();
    }

    for (i = 0; i < embers.length; i++) {
      const em = embers[i];
      if (em.leaf) {
        ctx.fillStyle = rgba(LEAF, 0.12 * em.a);
        ctx.fillRect(sx(em.x), sy(em.y), (2 + em.s) * scale, em.s * scale);
      } else {
        ctx.fillStyle = rgba(HOT2, em.a * 0.4);
        ctx.fillRect(sx(em.x), sy(em.y), em.s * scale, em.s * scale);
      }
    }
  }

  function drawSoldier(p, opt) {
    if (opt.blink && ((G.t * 18) | 0) % 2 === 0) return;
    const s = scale * (opt.size || 1);
    ctx.save();
    ctx.translate(sx(p.x), sy(p.y));
    const run = opt.run || 0;
    const leg = Math.sin(run) * 4.5;
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 14 * s, 10 * s, 3.6 * s, 0, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = rgba(opt.leg || KHAKI, 0.95);
    ctx.lineWidth = 3.2 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-4 * s, 4 * s);
    ctx.lineTo(-6 * s - leg * 0.3 * s, 13 * s);
    ctx.moveTo(4 * s, 4 * s);
    ctx.lineTo(6 * s + leg * 0.3 * s, 13 * s);
    ctx.stroke();

    ctx.fillStyle = rgba(opt.body || HOT, 0.96);
    ctx.beginPath();
    ctx.ellipse(0, 1 * s, 8.5 * s, 9 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(opt.helm || GOLD, 0.95);
    ctx.beginPath();
    ctx.arc(0, -7 * s, 6.2 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(opt.vis || CYN, 0.9);
    ctx.fillRect(-4 * s, -8 * s, 8 * s, 3 * s);

    const ax = p.ax || 0;
    const ay = p.ay || -1;
    ctx.strokeStyle = rgba(opt.gun || HOT2, 0.95);
    ctx.lineWidth = 2.6 * s;
    ctx.beginPath();
    ctx.moveTo(ax * 5 * s, ay * 3 * s);
    ctx.lineTo(ax * 18 * s, ay * 16 * s);
    ctx.stroke();
    if (opt.muzzle) {
      ctx.fillStyle = rgba(WHT, 0.95);
      ctx.beginPath();
      ctx.arc(ax * 20 * s, ay * 18 * s, 4.6 * s, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawEnemy(e) {
    if (!e.alive && e.flash <= 0) return;
    const s = scale;
    const x = sx(e.x);
    const y = sy(e.y);
    const flash = e.flash > 0;
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(sx(e.x), sy(e.y) + 8 * s, 8 * s, 3 * s, 0, 0, TAU);
    ctx.fill();

    if (e.kind === 'bunker') {
      ctx.fillStyle = rgba(flash ? WHT : MUD, 0.96);
      ctx.fillRect(x - 19 * s, y - 11 * s, 38 * s, 22 * s);
      ctx.fillStyle = rgba(STL, 0.9);
      ctx.fillRect(x - 19 * s, y - 11 * s, 38 * s, 5 * s);
      ctx.fillStyle = rgba(DEEP, 0.9);
      ctx.fillRect(x - 8 * s, y - 4 * s, 16 * s, 6 * s);
      ctx.fillStyle = rgba(MAG, 0.85);
      ctx.fillRect(x - 2 * s, y - 2 * s, 8 * s, 2.4 * s);
      return;
    }
    if (e.kind === 'jeep') {
      ctx.fillStyle = rgba(flash ? WHT : STL, 0.96);
      ctx.fillRect(x - 20 * s, y - 9 * s, 40 * s, 18 * s);
      ctx.fillStyle = rgba(HOT, 0.8);
      ctx.fillRect(x - 8 * s, y - 14 * s, 16 * s, 7 * s);
      ctx.fillStyle = rgba(CYN, 0.8);
      ctx.fillRect(x - 6 * s, y - 12 * s, 12 * s, 3 * s);
      ctx.fillStyle = rgba(IRON, 0.9);
      ctx.beginPath();
      ctx.arc(x - 12 * s, y + 9 * s, 4 * s, 0, TAU);
      ctx.arc(x + 12 * s, y + 9 * s, 4 * s, 0, TAU);
      ctx.fill();
      return;
    }
    if (e.kind === 'pow') {
      const pulse = 0.55 + Math.sin(G.t * 6) * 0.25;
      ctx.fillStyle = rgba(GOLD, 0.18 * pulse);
      ctx.beginPath();
      ctx.arc(x, y, 14 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(flash ? WHT : PINK, 0.95);
      ctx.beginPath();
      ctx.arc(x, y - 4 * s, 5 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.9);
      ctx.fillRect(x - 5 * s, y + 1 * s, 10 * s, 8 * s);
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.font = 'bold ' + (9 * s) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('救', x, y - 14 * s);
      return;
    }
    if (e.kind === 'sniper') {
      ctx.fillStyle = rgba(flash ? WHT : IRON, 0.95);
      ctx.beginPath();
      ctx.ellipse(x, y, 9 * s, 8 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(MAG, 0.9);
      ctx.fillRect(x - 3 * s, y - 10 * s, 6 * s, 5 * s);
      ctx.strokeStyle = rgba(HOT2, 0.9);
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 14 * s);
      ctx.stroke();
      return;
    }
    if (e.kind === 'runner') {
      ctx.fillStyle = rgba(flash ? WHT : MAG, 0.92);
      ctx.beginPath();
      ctx.ellipse(x, y, 8 * s, 10 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.fillRect(x - 4 * s, y - 8 * s, 8 * s, 3 * s);
      return;
    }
    ctx.fillStyle = rgba(flash ? WHT : KHAKI, 0.95);
    ctx.beginPath();
    ctx.ellipse(x, y, 8 * s, 9 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.85);
    ctx.beginPath();
    ctx.arc(x, y - 7 * s, 5 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(MAG, 0.8);
    ctx.fillRect(x - 3 * s, y - 2 * s, 6 * s, 2 * s);
  }

  function drawBoss() {
    const b = G.boss;
    if (!b || b.dead || !b.active) return;
    const s = scale;
    const x = sx(b.x);
    const y = sy(b.y);
    const flash = b.flash > 0;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(x, y + 22 * s, 22 * s, 7 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(flash ? WHT : IRON, 0.96);
    ctx.beginPath();
    ctx.ellipse(x, y, b.r * s, b.r * 0.72 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.85);
    ctx.beginPath();
    ctx.ellipse(x, y - 6 * s, 18 * s, 10 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(CYN, 0.85);
    ctx.fillRect(x - 10 * s, y - 8 * s, 20 * s, 5 * s);
    ctx.fillStyle = rgba(GOLD, 0.8);
    ctx.fillRect(x - 16 * s, y + 4 * s, 32 * s, 4 * s);
    if (b.kind === 'base') {
      ctx.strokeStyle = rgba(MAG, 0.7);
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.arc(x, y, (b.r + 6) * s, 0, TAU);
      ctx.stroke();
    }
  }

  function drawShot(s) {
    const rad = s.r * scale;
    ctx.fillStyle = s.from === 'p'
      ? rgba(s.kind === 'spread' ? CYN : GOLD, 0.95)
      : rgba(s.kind === 'heavy' ? MAG : PINK, 0.92);
    ctx.beginPath();
    ctx.arc(sx(s.x), sy(s.y), rad + 0.6 * scale, 0, TAU);
    ctx.fill();
    if (s.from === 'p') {
      ctx.strokeStyle = rgba(WHT, 0.45);
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(s.x - s.vx * 0.012), sy(s.y - s.vy * 0.012));
      ctx.lineTo(sx(s.x), sy(s.y));
      ctx.stroke();
    }
  }

  function drawNades() {
    for (let i = 0; i < G.nadeshots.length; i++) {
      const n = G.nadeshots[i];
      const lift = n.z * 0.45 * scale;
      ctx.fillStyle = 'rgba(0,0,0,' + (0.28 - Math.min(0.18, n.z * 0.003)) + ')';
      ctx.beginPath();
      ctx.ellipse(sx(n.x), sy(n.y) + 6 * scale, (5 + n.z * 0.04) * scale, 2.4 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.arc(sx(n.x), sy(n.y) - lift, 4.4 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.9);
      ctx.beginPath();
      ctx.arc(sx(n.x), sy(n.y) - lift - 3 * scale, 1.6 * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawPickups() {
    for (let i = 0; i < G.pickups.length; i++) {
      const u = G.pickups[i];
      const pulse = 0.7 + Math.sin(G.t * 8 + u.t) * 0.3;
      const rgb = u.kind === 'spread' ? CYN : GOLD;
      ctx.fillStyle = rgba(rgb, 0.18 * pulse);
      ctx.beginPath();
      ctx.arc(sx(u.x), sy(u.y), 12 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(rgb, 0.95);
      ctx.beginPath();
      ctx.arc(sx(u.x), sy(u.y), 6 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(DEEP, 0.9);
      ctx.font = 'bold ' + (8 * scale) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(u.kind === 'spread' ? '散' : '雷', sx(u.x), sy(u.y));
    }
  }

  function drawFx() {
    let i;
    let o;
    for (i = 0; i < rings.length; i++) {
      o = rings[i];
      const a = 1 - o.t / 0.42;
      ctx.strokeStyle = rgba(o.rgb, a * 0.8);
      ctx.lineWidth = 2.2 * scale;
      ctx.beginPath();
      ctx.arc(sx(o.x), sy(o.y), (o.r + o.t * 70) * scale, 0, TAU);
      ctx.stroke();
    }
    for (i = 0; i < sparks.length; i++) {
      o = sparks[i];
      const a = 1 - o.t / 0.28;
      ctx.fillStyle = rgba(WHT, a);
      ctx.beginPath();
      ctx.arc(sx(o.x), sy(o.y), (o.rad * (1 - o.t / 0.28) * 0.4) * scale, 0, TAU);
      ctx.fill();
    }
    for (i = 0; i < particles.length; i++) {
      o = particles[i];
      ctx.fillStyle = rgba(o.rgb, clamp(o.life / o.max, 0, 1));
      ctx.beginPath();
      ctx.arc(sx(o.x), sy(o.y), o.r * scale, 0, TAU);
      ctx.fill();
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (i = 0; i < floats.length; i++) {
      o = floats[i];
      const a = 1 - o.t / o.life;
      ctx.fillStyle = rgba(o.rgb, a);
      ctx.font = 'bold ' + (o.size * scale) + 'px sans-serif';
      ctx.fillText(o.text, sx(o.x), sy(o.y));
    }
  }

  function draw() {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#140c04';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    const shx = G.shake && !REDUCE ? (hash2((G.t * 80) | 0) - 0.5) * G.shake : 0;
    const shy = G.shake && !REDUCE ? (hash2((G.t * 80 + 9) | 0) - 0.5) * G.shake : 0;
    ctx.translate(shx, shy);
    if (G.punch !== 1 && !REDUCE) {
      const cx = ox + VW * scale * 0.5;
      const cy = oy + VH * scale * 0.5;
      ctx.translate(cx, cy);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-cx, -cy);
    }

    drawSky();
    drawBackdrop();

    let i;
    for (i = 0; i < G.enemies.length; i++) drawEnemy(G.enemies[i]);
    drawBoss();
    drawPickups();
    for (i = 0; i < G.shots.length; i++) drawShot(G.shots[i]);
    drawNades();

    if (G.player && G.deadT <= 0 && G.mode !== 'lose') {
      drawSoldier(G.player, {
        run: G.player.run,
        muzzle: G.muzzle > 0,
        blink: G.invuln > 0 && G.mode === 'play'
      });
    }

    drawFx();

    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.55);
      ctx.fillRect(ox, oy, VW * scale, VH * scale);
    }
    ctx.restore();
  }

  function resize() {
    if (!stageEl || !canvas) return;
    const rect = stageEl.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    canvas.width = Math.max(1, (W * dpr) | 0);
    canvas.height = Math.max(1, (H * dpr) | 0);
    scale = Math.min(W / VW, H / VH);
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
  }

  function resetRun(kind) {
    G.kind = kind || 'raid';
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.nextLife = LIFE_EVERY;
    G.nades = isDense() ? 4 : NADE_START;
    G.spreadT = 0;
    G.why = '';
    loadStage(1, false);
  }

  function startGame(kind) {
    audio.ensure();
    audio.start();
    G.mode = 'play';
    resetRun(kind);
    hideOverlay();
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = G.kind === 'dense' ? 'dense' : 'raid';
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.nades = NADE_START;
    G.spreadT = 0;
    loadStage(1, true);
    seedEmbers();
    showOverlay('title', '佣兵', LEAD);
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') {
      startGame('raid');
      return;
    }
    startGame(G.kind);
  }

  function primaryAction() {
    if (G.mode === 'title') startGame('raid');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'a' || k === 'A' || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S';
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';
    const shift = k === 'Shift' || code === 'ShiftLeft' || code === 'ShiftRight';
    const zee = k === 'z' || k === 'Z';

    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
    if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') keys.u = down;
    if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') keys.d = down;
    if (space) keys.fire = down;
    if (shift || zee) {
      keys.nade = down;
      if (down) nadeQueued = true;
    }

    if (down && (isMove || space || shift || zee || k === 'Enter')) e.preventDefault();
    if (!down) return;

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
      startGame('raid');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      startGame('dense');
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        keys.fire = false;
        return;
      }
    }
  }

  function bindPad() {
    function hold(node, on, off) {
      if (!node) return;
      const down = function (e) {
        e.preventDefault();
        audio.ensure();
        node.classList.add('held');
        on();
      };
      const up = function (e) {
        e.preventDefault();
        node.classList.remove('held');
        if (off) off();
      };
      node.addEventListener('pointerdown', down);
      node.addEventListener('pointerup', up);
      node.addEventListener('pointercancel', up);
      node.addEventListener('pointerleave', up);
    }
    hold(el('btn-left'), function () { keys.l = true; }, function () { keys.l = false; });
    hold(el('btn-right'), function () { keys.r = true; }, function () { keys.r = false; });
    hold(el('btn-up'), function () { keys.u = true; }, function () { keys.u = false; });
    hold(el('btn-down'), function () { keys.d = true; }, function () { keys.d = false; });
    hold(el('btn-fire'), function () { keys.fire = true; }, function () { keys.fire = false; });
    hold(el('btn-nade'), function () { keys.nade = true; nadeQueued = true; }, function () { keys.nade = false; });
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      if (overlayOpen() && G.mode !== 'play') return;
      if (e.button === 2) {
        keys.nade = true;
        nadeQueued = true;
        return;
      }
      pointer.down = true;
      pointer.id = e.pointerId;
      const w = clientToWorld(e.clientX, e.clientY);
      pointer.x = w.x;
      pointer.y = w.y;
      keys.fire = true;
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!pointer.down || (pointer.id != null && e.pointerId !== pointer.id)) return;
      const w = clientToWorld(e.clientX, e.clientY);
      pointer.x = w.x;
      pointer.y = w.y;
    });
    const up = function (e) {
      if (e && e.button === 2) {
        keys.nade = false;
        return;
      }
      pointer.down = false;
      pointer.id = null;
      keys.fire = false;
    };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
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

  seedEmbers();
  loadBest();
  initMute();
  goTitle();
  resize();
  bindPointer();
  bindPad();

  if (btnRaid) {
    btnRaid.addEventListener('click', function () {
      audio.ensure();
      startGame('raid');
    });
  }
  if (btnDense) {
    btnDense.addEventListener('click', function () {
      audio.ensure();
      startGame('dense');
    });
  }
  if (ovAgain) {
    ovAgain.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind);
    });
  }
  if (ovMenu) {
    ovMenu.addEventListener('click', function () {
      audio.ensure();
      goTitle();
    });
  }
  if (modeRaid) {
    modeRaid.addEventListener('click', function () {
      audio.ensure();
      startGame('raid');
    });
  }
  if (modeDense) {
    modeDense.addEventListener('click', function () {
      audio.ensure();
      startGame('dense');
    });
  }
  if (btnRetry) btnRetry.addEventListener('click', restart);
  if (btnMute) {
    btnMute.addEventListener('click', function () {
      audio.ensure();
      audio.setMuted(!audio.muted);
    });
  }

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (hidden) {
      keys.l = false;
      keys.r = false;
      keys.u = false;
      keys.d = false;
      keys.fire = false;
      keys.nade = false;
      pointer.down = false;
    }
  });

  requestAnimationFrame(frame);
})();
