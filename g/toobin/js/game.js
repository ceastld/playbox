'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const PLAYER_SY = 508;
  const TUBE_R = 15;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 12000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.48;
  const MAX_CANS = 12;
  const START_CANS = 8;
  const CAN_V = 396;
  const CAN_CD = 0.2;
  const MAX_SHOTS = 3;
  const BEST_KEY = 'playbox-toobin-best';
  const MUTE_KEY = 'playbox-toobin-mute';
  const OPS = '← → ↑ ↓ / WASD 划水 · 空格丢罐 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 232, 240];
  const ICE = [110, 240, 255];
  const GOLD = [255, 227, 107];
  const WHT = [232, 251, 255];
  const PNK = [255, 176, 210];
  const TEAL = [20, 208, 200];
  const FOAM = [180, 240, 248];

  const STAGES = [
    { name: '翠峡', len: 2100, current: 112, rock: 0.40, log: 0.12, gator: 0.00, whirl: 0.00, gate: 0.22, pack: 0.14 },
    { name: '金门', len: 2300, current: 126, rock: 0.26, log: 0.18, gator: 0.05, whirl: 0.00, gate: 0.34, pack: 0.11 },
    { name: '鳄湾', len: 2500, current: 140, rock: 0.20, log: 0.14, gator: 0.34, whirl: 0.06, gate: 0.18, pack: 0.10 },
    { name: '漩心', len: 2500, current: 152, rock: 0.16, log: 0.10, gator: 0.10, whirl: 0.38, gate: 0.16, pack: 0.10 },
    { name: '霓滩', len: 2700, current: 166, rock: 0.26, log: 0.18, gator: 0.18, whirl: 0.16, gate: 0.22, pack: 0.08 },
    { name: '飞瀑', len: 1520, current: 198, rock: 0.32, log: 0.08, gator: 0.06, whirl: 0.08, gate: 0.10, pack: 0.06, falls: true }
  ];

  const SCORE = { rock: 50, big: 0, log: 80, gator: 200, whirl: 150, gate: 250, pack: 30 };

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: false });
  const overlay = document.getElementById('overlay');
  const panel = document.getElementById('panel');
  const ovKicker = document.getElementById('ov-kicker');
  const ovTitle = document.getElementById('ov-title');
  const ovLead = document.getElementById('ov-lead');
  const ovOps = document.getElementById('ov-ops');
  const btnFlow = document.getElementById('btn-flow');
  const btnRapids = document.getElementById('btn-rapids');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const padsEl = document.getElementById('pads');
  const padL = document.getElementById('pad-l');
  const padR = document.getElementById('pad-r');
  const padU = document.getElementById('pad-u');
  const padD = document.getElementById('pad-d');
  const padThrow = document.getElementById('pad-throw');
  const canBar = document.getElementById('can-bar');
  const canWrap = document.getElementById('can-wrap');
  const canCount = document.getElementById('can-count');

  let W = 1;
  let H = 1;
  let dpr = 1;
  let scale = 1;
  let ox = 0;
  let oy = 0;
  let hidden = false;
  let addTok = 0;
  let kickTok = 0;
  let comboTok = 0;

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, x: VW * 0.5, y: PLAYER_SY, id: null, t0: 0, x0: 0, y0: 0 };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const wakes = [];
  const foams = [];

  const G = {
    mode: 'title',
    kind: 'flow',
    t: 0,
    clock: 0,
    cam: 0,
    player: { x: VW * 0.5, wy: 0, vx: 0, vwy: 0, facingX: 0, facingY: -1 },
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    nextLife: LIFE_EVERY,
    cans: START_CANS,
    stageIx: 0,
    stageStart: 0,
    ents: [],
    shots: [],
    spawnAt: 0,
    fireCd: 0,
    paddleT: 0,
    splashT: 0,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: CYN,
    punch: 1,
    throwKick: 0,
    toastT: 0,
    winT: 0,
    why: '',
    rec: false
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
  function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function isRapids() {
    return G.kind === 'rapids';
  }
  function curStage() {
    return STAGES[G.stageIx] || STAGES[STAGES.length - 1];
  }
  function worldY(screenY) {
    return G.cam + (PLAYER_SY - screenY);
  }
  function screenY(wy) {
    return PLAYER_SY - (wy - G.cam);
  }
  function playerSY() {
    return screenY(G.player.wy);
  }

  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function valNoise(x, salt) {
    const i = Math.floor(x);
    const f = x - i;
    const u = f * f * (3 - 2 * f);
    const a = hash2(i + salt * 9973);
    const b = hash2(i + 1 + salt * 9973);
    return a + (b - a) * u;
  }
  function fbm(x, salt) {
    return valNoise(x, salt) * 0.55
      + valNoise(x * 2.07, salt + 17) * 0.3
      + valNoise(x * 4.13, salt + 31) * 0.15;
  }

  function riverAt(y) {
    const rap = isRapids();
    const meander = rap ? 148 : 118;
    const n1 = fbm(y * 0.00168, 2);
    const n2 = fbm(y * 0.00062, 7);
    let cx = VW * 0.5 + (n1 - 0.5) * meander + (n2 - 0.5) * 32;
    const base = rap ? 122 : 176;
    const varW = rap ? 58 : 70;
    let w = base + (fbm(y * 0.00228, 4) - 0.5) * varW * 2;
    const canyon = fbm(y * 0.00102, 13);
    if (canyon > 0.72) {
      const t = (canyon - 0.72) / 0.28;
      w *= 1 - (rap ? 0.42 : 0.32) * t * t;
    }
    w = Math.max(rap ? 68 : 92, w);

    const local = y - G.stageStart;
    if (local < 340 && G.stageIx === 0 && G.cam < 400) {
      const t = 1 - clamp(y / 340, 0, 1);
      const e = t * t * (3 - 2 * t);
      cx = lerp(cx, VW * 0.5, e);
      w = lerp(w, rap ? 196 : 248, e);
    }

    const st = curStage();
    if (st.falls) {
      const t = clamp((local - (st.len - 560)) / 560, 0, 1);
      const e = t * t;
      w = lerp(w, rap ? 70 : 82, e);
      cx = lerp(cx, VW * 0.5, e);
    }

    let L = cx - w * 0.5;
    let R = cx + w * 0.5;
    if (L < 18) {
      R += 18 - L;
      L = 18;
    }
    if (R > VW - 18) {
      L -= R - (VW - 18);
      R = VW - 18;
    }
    L = Math.max(14, L);
    R = Math.min(VW - 14, R);
    if (R - L < 60) {
      const m = (L + R) * 0.5;
      L = m - 30;
      R = m + 30;
    }
    return { L: L, R: R, cx: (L + R) * 0.5, w: R - L };
  }

  function onBank(x, wy, rad) {
    const r = riverAt(wy);
    return x - rad < r.L || x + rad > r.R;
  }

  function waterX(wy, margin, pick) {
    const r = riverAt(wy);
    const a = r.L + margin;
    const b = r.R - margin;
    if (b <= a) return r.cx;
    return lerp(a, b, pick);
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
    paddle() {
      this.ensure();
      this.noise(0.045, 0.022, 420);
      this.beep(180, 0.04, 'sine', 0.016, 90);
    },
    throw() {
      this.ensure();
      this.beep(880, 0.055, 'square', 0.03, 240);
      this.beep(420, 0.04, 'triangle', 0.016, 160);
    },
    empty() {
      this.ensure();
      this.beep(160, 0.07, 'sine', 0.02, 80);
    },
    hit(kind) {
      this.ensure();
      const base = kind === 'gator' ? 520 : kind === 'whirl' ? 360 : kind === 'log' ? 300 : 440;
      this.noise(0.06, 0.046, 900);
      this.beep(base, 0.09, 'square', 0.048, base * 1.55);
      this.beep(base * 0.55, 0.12, 'triangle', 0.028, base * 0.3);
    },
    gate() {
      this.ensure();
      this.beep(523, 0.07, 'sine', 0.04, 784);
      this.beep(784, 0.12, 'triangle', 0.036, 1175);
    },
    pack() {
      this.ensure();
      this.beep(660, 0.06, 'square', 0.032, 990);
      this.beep(990, 0.1, 'sine', 0.028, 1320);
    },
    combo(m) {
      this.ensure();
      this.beep(392 * m, 0.08, 'sine', 0.038, 588 * m);
      this.beep(784, 0.12, 'triangle', 0.028, 1176);
    },
    extra() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.038, 784);
      this.beep(784, 0.1, 'triangle', 0.038, 1046);
      this.beep(1046, 0.18, 'sine', 0.042, 1568);
    },
    death() {
      this.ensure();
      this.noise(0.16, 0.06, 280);
      this.beep(220, 0.22, 'sawtooth', 0.05, 52);
      this.beep(120, 0.32, 'sine', 0.04, 40);
    },
    stage() {
      this.ensure();
      this.beep(330, 0.08, 'sine', 0.036, 494);
      this.beep(494, 0.1, 'sine', 0.036, 659);
      this.beep(784, 0.16, 'triangle', 0.034, 988);
    },
    win() {
      this.ensure();
      this.beep(392, 0.1, 'square', 0.04, 523);
      this.beep(523, 0.12, 'triangle', 0.04, 659);
      this.beep(784, 0.18, 'sine', 0.042, 1046);
      this.beep(1046, 0.28, 'triangle', 0.038, 1568);
    },
    lose() {
      this.ensure();
      this.beep(196, 0.18, 'sawtooth', 0.038, 80);
      this.beep(110, 0.32, 'sine', 0.046, 42);
    },
    start() {
      this.ensure();
      this.beep(392, 0.08, 'square', 0.038, 784);
      this.beep(784, 0.14, 'triangle', 0.032, 1176);
    },
    splash() {
      this.ensure();
      this.noise(0.08, 0.034, 600);
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
    G.rec = true;
    if (bestEl) bestEl.textContent = String(G.best);
    try {
      localStorage.setItem(BEST_KEY, String(G.best));
    } catch (err) { /* ignore */ }
  }

  function addScore(n) {
    if ((G.mode !== 'play' && G.mode !== 'winfall') || n <= 0) return;
    G.score += n;
    if (scoreEl) scoreEl.textContent = String(G.score);
    saveBest();
    while (G.score >= G.nextLife && G.lives < LIFE_CAP) {
      G.nextLife += LIFE_EVERY;
      G.lives += 1;
      audio.extra();
      toast('额外生命', false, true);
      screenFlash(GOLD, 0.5);
      kick(3.2);
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

  function syncPips() {
    if (!pipsEl) return;
    const n = Math.max(LIVES, G.lives);
    while (pips.length < n) {
      const d = document.createElement('i');
      d.className = 'pip on';
      pipsEl.appendChild(d);
      pips.push(d);
    }
    while (pips.length > n && pips.length > LIVES) {
      const d = pips.pop();
      if (d && d.parentNode) d.parentNode.removeChild(d);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].className = 'pip' + (i < G.lives ? ' on' : ' gone');
    }
  }

  function comboMult() {
    return 1 + Math.min(4, Math.floor(Math.max(0, G.combo - 1) / 3));
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const prev = G.mult;
    G.mult = comboMult();
    if (G.mult > prev) {
      audio.combo(G.mult);
      toast('连击 ×' + G.mult, false, true);
      if (comboEl) {
        comboTok += 1;
        comboEl.classList.remove('hot');
        void comboEl.offsetWidth;
        comboEl.classList.add('hot');
      }
    }
  }

  function syncCans() {
    const t = G.cans / MAX_CANS;
    if (canBar) canBar.style.transform = 'scaleX(' + clamp(t, 0, 1) + ')';
    if (canCount) canCount.textContent = String(G.cans);
    if (canWrap) {
      canWrap.classList.toggle('low', G.cans <= 2 && G.mode === 'play');
      canWrap.classList.toggle('hot', G.cans >= MAX_CANS - 1);
    }
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    const st = curStage();
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '河道';
      else stageLabel.textContent = st.name;
      stageLabel.classList.toggle('hot', G.mode === 'play' && (st.falls || G.stageIx >= 4));
    }
    if (tagLabel) {
      tagLabel.textContent = isRapids() ? '急流' : '漂流';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1);
      tagLabel.classList.toggle('hot', G.combo >= 8 || st.falls);
    }
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = '连击 ×' + G.mult;
      } else {
        comboEl.hidden = true;
      }
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 撞岩撞岸即扣命', 'warn');
    else if (G.mode === 'win') setHint('飞瀑过了 · R 再冲一次', 'hot');
    else if (st.falls) setHint('飞瀑将至 · 盯住河心冲下去', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 空罐也可硬闯金门', 'warn');
    else setHint('← → 左右划 · ↑ 加速 · 空格丢罐 · 穿过金门', G.combo >= 6 ? 'hot' : '');
    syncPips();
    syncCans();
  }

  function showOverlay(kind, title, lead, primary, showSecond) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'WIPE' : kind === 'win' ? 'FALLS' : 'TOBN';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    btnFlow.textContent = primary;
    btnRapids.classList.toggle('hidden', !showSecond);
    if (kind === 'lose' || kind === 'win') btnRapids.textContent = '换模式';
    else btnRapids.textContent = '急流';
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (canvas && canvas.focus) canvas.focus();
  }

  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }

  function hitStop(sec) {
    if (REDUCE || G.mode !== 'play') return;
    G.stop = Math.max(G.stop, sec);
  }

  function kick(mag) {
    if (REDUCE || (G.mode !== 'play' && G.mode !== 'winfall')) return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.05, mag * 0.008));
    if (!stageEl) return;
    kickTok += 1;
    const cls = mag >= 5 ? 'die' : 'hit';
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
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
        g: spec.g == null ? 0 : spec.g
      });
    }
    capArr(particles, 380);
  }

  function popSpark(x, y, rgb, rad) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb, rad: rad || 16 });
    capArr(sparks, 48);
  }

  function popRing(x, y, rgb, r) {
    rings.push({ x: x, y: y, t: 0, rgb: rgb, r: r || 10 });
    capArr(rings, 36);
  }

  function popFloat(x, y, text, rgb, gold) {
    floats.push({
      x: x,
      y: y,
      vy: -56,
      t: 0,
      life: 0.76,
      text: text,
      rgb: rgb,
      gold: !!gold,
      size: gold ? 16 : 13
    });
    capArr(floats, 28);
  }

  function splashAt(x, y, n, rgb) {
    emit(n || 10, {
      x: x, y: y, j: 6,
      vx0: -90, vx1: 90, vy0: -140, vy1: -20,
      r0: 1.2, r1: 3.4, life: 0.42, rgb: rgb || FOAM, g: 220
    });
  }

  function makeRockPts(r) {
    const n = 7 + ((Math.random() * 4) | 0);
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + rand(-0.12, 0.12);
      const rr = r * rand(0.68, 1.14);
      pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
    }
    return pts;
  }

  function occupied(x, wy, rad) {
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      const er = e.r || (e.kind === 'log' ? 16 : e.kind === 'gate' ? e.w * 0.5 : 14);
      if (hypot(e.x - x, e.wy - wy) < rad + er + 8) return true;
    }
    return false;
  }

  function spawnGap() {
    const st = curStage();
    const g = isRapids() ? 76 : 106;
    return st.falls ? g * 0.88 : g;
  }

  function pickKind(st, h) {
    const rap = isRapids() ? 1.28 : 1;
    const items = [
      ['gate', st.gate * (isRapids() ? 1.12 : 1)],
      ['rock', st.rock * rap],
      ['log', st.log * rap],
      ['gator', st.gator * (isRapids() ? 1.38 : 1)],
      ['whirl', st.whirl * (isRapids() ? 1.32 : 1)],
      ['pack', st.pack]
    ];
    let sum = 0;
    for (let i = 0; i < items.length; i++) sum += items[i][1];
    const cap = Math.min(0.9, sum);
    if (h > cap) return null;
    let acc = 0;
    for (let i = 0; i < items.length; i++) {
      acc += items[i][1];
      if (h <= acc) return items[i][0];
    }
    return null;
  }

  function pushEnt(e) {
    e.alive = true;
    G.ents.push(e);
  }

  function spawnAt(wy) {
    const st = curStage();
    const r = riverAt(wy);
    if (r.w < 72) return;
    if (wy < G.stageStart + 300) return;
    const local = wy - G.stageStart;
    const funnel = st.falls && local > st.len - 520;
    const h = hash2((wy * 13 + G.stageIx * 97) | 0);
    const h2 = hash2((wy * 29 + 3) | 0);
    let kind = funnel ? 'rock' : pickKind(st, h);
    if (funnel && h > 0.55) kind = null;
    if (!kind) return;
    const margin = kind === 'gate' ? 36 : kind === 'whirl' ? 34 : 28;
    const x = waterX(wy, margin, 0.18 + h2 * 0.64);
    if (occupied(x, wy, 22)) return;

    if (kind === 'rock') {
      const big = funnel ? h2 > 0.45 : h2 > 0.62;
      const rad = big ? rand(18, 24) : rand(10, 14);
      pushEnt({
        kind: 'rock', x: x, wy: wy, r: rad, big: big,
        hp: big ? 99 : 1, ang: rand(0, TAU), spin: rand(-0.7, 0.7),
        pts: makeRockPts(rad)
      });
    } else if (kind === 'log') {
      pushEnt({
        kind: 'log', x: x, wy: wy, r: 15, w: rand(30, 42), h: 9,
        ang: rand(-0.25, 0.25), vx: rand(-18, 18), hp: 1
      });
    } else if (kind === 'gator') {
      pushEnt({
        kind: 'gator', x: x, wy: wy, r: 16, dir: h2 > 0.5 ? 1 : -1,
        t: rand(0, TAU), hp: 1, snap: 0
      });
    } else if (kind === 'whirl') {
      pushEnt({
        kind: 'whirl', x: r.cx + (h2 - 0.5) * r.w * 0.28, wy: wy,
        r: rand(22, 28), hp: 2, ang: 0
      });
    } else if (kind === 'gate') {
      const gw = clamp(r.w * 0.42, 64, 108);
      const gx = clamp(x, r.L + gw * 0.5 + 10, r.R - gw * 0.5 - 10);
      pushEnt({
        kind: 'gate', x: gx, wy: wy, w: gw, r: gw * 0.5, passed: false, hp: 0
      });
    } else if (kind === 'pack') {
      pushEnt({
        kind: 'pack', x: x, wy: wy, r: 11, n: 3, hp: 0, bob: rand(0, TAU)
      });
    }

    if (isRapids() && kind === 'rock' && h2 > 0.78 && !funnel) {
      const x2 = waterX(wy + 16, 30, 1 - h2);
      if (!occupied(x2, wy + 18, 16)) {
        const rad = rand(10, 13);
        pushEnt({
          kind: 'rock', x: x2, wy: wy + 18, r: rad, big: false,
          hp: 1, ang: rand(0, TAU), spin: rand(-0.8, 0.8),
          pts: makeRockPts(rad)
        });
      }
    }
  }

  function spawnTick() {
    const ahead = G.player.wy + 860;
    while (G.spawnAt < ahead) {
      G.spawnAt += spawnGap();
      spawnAt(G.spawnAt);
    }
    const back = G.cam - 160;
    for (let i = G.ents.length - 1; i >= 0; i--) {
      if (G.ents[i].wy < back) G.ents.splice(i, 1);
    }
    if (G.ents.length > 80) G.ents.splice(0, G.ents.length - 80);
  }

  function award(base, x, y, gold) {
    bumpCombo();
    const n = Math.round(base * G.mult);
    addScore(n);
    popFloat(x, y, '+' + n, gold ? GOLD : ICE, !!gold || G.mult >= 2);
  }

  function breakEnt(e, byCan) {
    e.alive = false;
    const syv = screenY(e.wy);
    if (e.kind === 'rock') {
      splashAt(e.x, syv, 16, ICE);
      popSpark(e.x, syv, CYN, e.r + 8);
      emit(14, {
        x: e.x, y: syv, j: e.r * 0.6,
        vx0: -160, vx1: 160, vy0: -180, vy1: 80,
        r0: 1.4, r1: 4, life: 0.5, rgb: ICE, g: 80
      });
      if (byCan) award(SCORE.rock, e.x, syv, false);
    } else if (e.kind === 'log') {
      splashAt(e.x, syv, 12, PNK);
      popSpark(e.x, syv, MAG, 18);
      emit(12, {
        x: e.x, y: syv, j: 8,
        vx0: -140, vx1: 140, vy0: -160, vy1: 40,
        r0: 1.2, r1: 3.2, life: 0.46, rgb: PNK, g: 60
      });
      if (byCan) award(SCORE.log, e.x, syv, false);
    } else if (e.kind === 'gator') {
      splashAt(e.x, syv, 18, GOLD);
      popRing(e.x, syv, GOLD, 12);
      emit(18, {
        x: e.x, y: syv, j: 10,
        vx0: -200, vx1: 200, vy0: -200, vy1: 80,
        r0: 1.6, r1: 4.2, life: 0.55, rgb: GOLD, g: 40
      });
      if (byCan) award(SCORE.gator, e.x, syv, true);
    } else if (e.kind === 'whirl') {
      popRing(e.x, syv, CYN, 16);
      splashAt(e.x, syv, 20, CYN);
      if (byCan) award(SCORE.whirl, e.x, syv, false);
    }
    if (byCan) {
      audio.hit(e.kind);
      hitStop(e.kind === 'gator' ? 0.062 : 0.042);
      kick(e.kind === 'gator' ? 4.2 : 2.6);
      screenFlash(e.kind === 'gator' ? GOLD : CYN, 0.28);
    }
  }

  function paddleVec() {
    let x = 0;
    let y = 0;
    if (keys.l) x -= 1;
    if (keys.r) x += 1;
    if (keys.u) y -= 1;
    if (keys.d) y += 1;
    if (pointer.down && G.mode === 'play') {
      const psy = playerSY();
      const dx = pointer.x - G.player.x;
      const dy = pointer.y - psy;
      const d = hypot(dx, dy);
      if (d > 10) {
        x = dx / d;
        y = dy / d;
      }
    }
    const d = hypot(x, y);
    if (d > 1) {
      x /= d;
      y /= d;
    }
    return { x: x, y: y };
  }

  function throwCan() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (overlayOpen()) return;
    if (G.fireCd > 0) return;
    if (G.cans <= 0) {
      audio.empty();
      toast('没罐了', true, false);
      return;
    }
    let n = 0;
    for (let i = 0; i < G.shots.length; i++) if (G.shots[i].life > 0) n += 1;
    if (n >= MAX_SHOTS) return;
    G.fireCd = CAN_CD;
    G.cans -= 1;
    G.throwKick = 0.12;
    syncCans();
    let fx = G.player.facingX;
    let fy = G.player.facingY;
    const d = hypot(fx, fy);
    if (d < 0.2) {
      fx = 0;
      fy = -1;
    } else {
      fx /= d;
      fy /= d;
    }
    const psy = playerSY();
    const nose = 18;
    G.shots.push({
      x: G.player.x + fx * nose,
      wy: G.player.wy - fy * nose,
      vx: fx * CAN_V,
      vwy: -fy * CAN_V,
      life: 0.72,
      rot: 0
    });
    audio.throw();
    popSpark(G.player.x + fx * 16, psy + fy * 16, GOLD, 8);
    emit(4, {
      x: G.player.x + fx * 14, y: psy + fy * 14, j: 2,
      vx0: fx * 40, vx1: fx * 120, vy0: fy * 40, vy1: fy * 120,
      r0: 0.8, r1: 1.8, life: 0.18, rgb: GOLD, g: 0
    });
    if (!REDUCE) G.punch = Math.max(G.punch, 1.012);
  }

  function die(why) {
    if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0) return;
    G.why = why;
    G.deadT = 0.88;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.lives -= 1;
    audio.death();
    hitStop(0.072);
    kick(7);
    screenFlash(MAG, 0.62);
    const psy = playerSY();
    splashAt(G.player.x, psy, 28, MAG);
    popRing(G.player.x, psy, MAG, 14);
    emit(26, {
      x: G.player.x, y: psy, j: 12,
      vx0: -220, vx1: 220, vy0: -240, vy1: 120,
      r0: 1.8, r1: 5, life: 0.7, rgb: MAG, g: 40
    });
    toast(why, true, false);
    syncHud();
  }

  function respawn() {
    if (G.lives <= 0) {
      loseRun(G.why || '翻管了');
      return;
    }
    const r = riverAt(G.player.wy);
    G.player.x = r.cx;
    G.player.vx = 0;
    G.player.vwy = 0;
    G.invuln = 1.7;
    G.deadT = 0;
    G.cans = Math.max(G.cans, 4);
    splashAt(G.player.x, playerSY(), 14, ICE);
    popRing(G.player.x, playerSY(), CYN, 10);
    syncHud();
  }

  function loseRun(why) {
    G.why = why;
    audio.lose();
    G.mode = 'lose';
    const rec = G.rec && G.score > 0;
    showOverlay(
      rec ? 'win' : 'lose',
      rec ? '新纪录' : '翻管了',
      '分数 ' + G.score + (rec ? ' · 写入最高' : ' · ' + (why || '撞上了')),
      '再来',
      true
    );
    syncHud();
  }

  function beginWin() {
    if (G.mode !== 'play') return;
    const bonus = Math.round((2500 + (isRapids() ? 800 : 0)) * Math.max(1, G.mult));
    addScore(bonus);
    G.mode = 'winfall';
    G.winT = 1.15;
    audio.win();
    hitStop(0.08);
    kick(5);
    screenFlash(GOLD, 0.7);
    toast('飞瀑过了', false, true);
    const psy = playerSY();
    splashAt(G.player.x, psy, 32, GOLD);
    popRing(G.player.x, psy, GOLD, 22);
    popFloat(G.player.x, psy - 10, '+' + bonus, GOLD, true);
    syncHud();
  }

  function finishWin() {
    G.mode = 'win';
    const rec = G.rec && G.score > 0;
    showOverlay(
      'win',
      rec ? '新纪录' : '飞瀑过了',
      '分数 ' + G.score + ' · 从翠峡冲到飞瀑' + (isRapids() ? ' · 急流' : ''),
      '再来',
      true
    );
    syncHud();
  }

  function advanceStage() {
    const st = curStage();
    if (st.falls) {
      beginWin();
      return;
    }
    const bonus = Math.round((800 + 200 * (G.stageIx + 1)) * G.mult);
    addScore(bonus);
    popFloat(G.player.x, playerSY() - 24, '+' + bonus, GOLD, true);
    G.stageIx += 1;
    G.stageStart = G.player.wy;
    const nxt = curStage();
    toast(nxt.name + (nxt.falls ? ' · 飞瀑' : ' · 加速'), false, true);
    audio.stage();
    screenFlash(nxt.falls ? GOLD : CYN, 0.35);
    kick(2.4);
    syncHud();
  }

  function resetWorld() {
    G.player.x = VW * 0.5;
    G.player.wy = 0;
    G.player.vx = 0;
    G.player.vwy = 0;
    G.player.facingX = 0;
    G.player.facingY = -1;
    G.cam = 0;
    G.ents.length = 0;
    G.shots.length = 0;
    G.spawnAt = 220;
    G.stageIx = 0;
    G.stageStart = 0;
    G.fireCd = 0;
    G.paddleT = 0;
    G.splashT = 0;
    G.deadT = 0;
    G.invuln = 1.05;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.throwKick = 0;
    G.winT = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    wakes.length = 0;
    seedFoam();
  }

  function seedFoam() {
    foams.length = 0;
    for (let i = 0; i < 48; i++) {
      foams.push({
        x: rand(40, VW - 40),
        y: rand(0, VH),
        r: rand(0.6, 1.8),
        a: rand(0.12, 0.4),
        s: rand(18, 46)
      });
    }
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'flow';
    G.score = 0;
    G.lives = LIVES;
    G.cans = START_CANS;
    G.rec = false;
    G.why = '';
    resetWorld();
    G.invuln = 0;
    showOverlay(
      'title',
      '漂流',
      '泳圈冲河，丢罐砸障。撞岩扣命。过金门，最后冲飞瀑。',
      '漂流',
      true
    );
    if (scoreEl) scoreEl.textContent = '0';
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'rapids' ? 'rapids' : 'flow';
    G.mode = 'play';
    G.score = 0;
    G.lives = LIVES;
    G.cans = START_CANS;
    G.nextLife = LIFE_EVERY;
    G.rec = false;
    G.why = '';
    resetWorld();
    hideOverlay();
    audio.start();
    toast(isRapids() ? '急流 · 更窄更快' : curStage().name, false, !isRapids());
    if (scoreEl) scoreEl.textContent = '0';
    syncHud();
  }

  function hitCanEnt(s, e) {
    if (!e.alive) return false;
    if (e.kind === 'gate' || e.kind === 'pack') return false;
    const dx = s.x - e.x;
    const dy = s.wy - e.wy;
    const rad = (e.r || 14) + 6;
    if (hypot(dx, dy) > rad) return false;
    if (e.kind === 'rock' && e.big) {
      s.life = 0;
      popSpark(s.x, screenY(s.wy), WHT, 10);
      audio.hit('rock');
      hitStop(0.03);
      kick(1.6);
      return true;
    }
    e.hp -= 1;
    s.life = 0;
    if (e.hp <= 0) breakEnt(e, true);
    else {
      popSpark(e.x, screenY(e.wy), CYN, 12);
      audio.hit(e.kind);
      hitStop(0.034);
      kick(2);
    }
    return true;
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.x += s.vx * dt;
      s.wy += s.vwy * dt;
      s.life -= dt;
      s.rot += 14 * dt;
      if (s.life <= 0 || s.x < -20 || s.x > VW + 20) {
        G.shots.splice(i, 1);
        continue;
      }
      let hit = false;
      for (let j = 0; j < G.ents.length; j++) {
        if (hitCanEnt(s, G.ents[j])) {
          hit = true;
          break;
        }
      }
      if (hit || s.life <= 0) G.shots.splice(i, 1);
    }
  }

  function updateEnts(dt) {
    const p = G.player;
    const psy = playerSY();
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      if (e.kind === 'log') {
        e.x += e.vx * dt;
        const rr = riverAt(e.wy);
        if (e.x < rr.L + 16 || e.x > rr.R - 16) e.vx *= -1;
        e.ang += e.vx * 0.01 * dt;
      } else if (e.kind === 'gator') {
        e.t += dt;
        e.x += e.dir * (isRapids() ? 58 : 44) * dt;
        const rr = riverAt(e.wy);
        if (e.x < rr.L + 20) {
          e.x = rr.L + 20;
          e.dir = 1;
        }
        if (e.x > rr.R - 20) {
          e.x = rr.R - 20;
          e.dir = -1;
        }
        const near = hypot(e.x - p.x, e.wy - p.wy) < 70;
        e.snap = near ? Math.min(1, e.snap + dt * 4) : Math.max(0, e.snap - dt * 2);
      } else if (e.kind === 'whirl') {
        e.ang += dt * 3.2;
        const dx = e.x - p.x;
        const dy = e.wy - p.wy;
        const d = hypot(dx, dy);
        if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0 && d < e.r + 56 && d > 0.1) {
          const pull = (isRapids() ? 92 : 74) * (1 - d / (e.r + 56));
          p.x += (dx / d) * pull * dt;
          p.wy += (dy / d) * pull * dt;
        }
      } else if (e.kind === 'rock') {
        e.ang += e.spin * dt;
      } else if (e.kind === 'pack') {
        e.bob += dt * 3;
      } else if (e.kind === 'gate' && !e.passed) {
        if (G.mode === 'play' && G.deadT <= 0) {
          if (p.wy > e.wy - 12 && p.wy < e.wy + 18) {
            if (Math.abs(p.x - e.x) < e.w * 0.5 - 4) {
              e.passed = true;
              const syv = screenY(e.wy);
              award(SCORE.gate, e.x, syv, true);
              audio.gate();
              hitStop(0.04);
              kick(2.8);
              popRing(e.x, syv, GOLD, 18);
              splashAt(e.x, syv, 10, GOLD);
              screenFlash(GOLD, 0.22);
            }
          }
        }
      }
    }

    for (let i = G.ents.length - 1; i >= 0; i--) {
      if (!G.ents[i].alive) G.ents.splice(i, 1);
    }

    if (G.mode !== 'play' || G.deadT > 0) return;

    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      if (e.kind === 'gate') continue;
      if (e.kind === 'pack') {
        if (hypot(e.x - p.x, e.wy - p.wy) < e.r + TUBE_R) {
          e.alive = false;
          G.cans = Math.min(MAX_CANS, G.cans + 3);
          addScore(SCORE.pack);
          audio.pack();
          popSpark(e.x, screenY(e.wy), GOLD, 14);
          popFloat(e.x, screenY(e.wy), '+3罐', GOLD, true);
          splashAt(e.x, screenY(e.wy), 8, GOLD);
          syncCans();
        }
        continue;
      }
      if (G.invuln > 0) continue;
      let hit = false;
      if (e.kind === 'whirl') {
        if (hypot(e.x - p.x, e.wy - p.wy) < e.r * 0.42) hit = true;
      } else if (e.kind === 'log') {
        if (Math.abs(e.x - p.x) < e.w * 0.5 + TUBE_R - 3 && Math.abs(e.wy - p.wy) < e.h + TUBE_R - 4) hit = true;
      } else if (e.kind === 'gator') {
        if (hypot(e.x - p.x, e.wy - p.wy) < TUBE_R + 12) hit = true;
      } else if (e.kind === 'rock') {
        if (hypot(e.x - p.x, e.wy - p.wy) < TUBE_R + e.r - 2) hit = true;
      }
      if (hit) {
        const why = e.kind === 'gator' ? '被鳄咬了'
          : e.kind === 'whirl' ? '卷入了'
            : e.kind === 'log' ? '撞上浮木'
              : '撞上岩石';
        die(why);
        return;
      }
    }
  }

  function updatePlayer(dt) {
    const p = G.player;
    const st = curStage();
    const pad = (G.mode === 'play' && G.deadT <= 0 && !overlayOpen()) ? paddleVec() : { x: 0, y: 0 };
    const paddling = hypot(pad.x, pad.y) > 0.15;

    if (paddling) {
      p.facingX = lerp(p.facingX, pad.x, 0.28);
      p.facingY = lerp(p.facingY, pad.y, 0.28);
      G.paddleT += dt;
      G.splashT -= dt;
      if (G.splashT <= 0) {
        G.splashT = 0.16;
        audio.paddle();
        const psy = playerSY();
        splashAt(p.x - pad.x * 10, psy - pad.y * 8, 5, FOAM);
        wakes.push({ x: p.x, y: psy + 8, t: 0, w: 10 });
        capArr(wakes, 28);
      }
    } else {
      G.splashT = 0;
    }

    const acc = isRapids() ? 640 : 560;
    p.vx += pad.x * acc * dt;
    p.vx *= Math.pow(0.18, dt);
    p.vx = clamp(p.vx, -240, 240);
    p.x += p.vx * dt;

    let flow = st.current * (isRapids() ? 1.26 : 1);
    if (st.falls) {
      const local = p.wy - G.stageStart;
      flow += 80 * clamp(local / st.len, 0, 1);
    }
    if (pad.y < -0.2) flow += (-pad.y) * (isRapids() ? 118 : 96);
    if (pad.y > 0.2) flow *= 1 - 0.42 * pad.y;
    if (G.mode === 'title') flow = 72;
    if (G.mode === 'winfall') flow = 260;
    if (G.deadT > 0) flow *= 0.45;

    p.wy += flow * dt;
    p.vwy = flow;

    if (G.mode === 'title' || G.mode === 'winfall') {
      p.x = riverAt(p.wy).cx;
    }

    if (G.mode === 'play' && G.deadT <= 0) {
      const r = riverAt(p.wy);
      if (p.x < r.L + TUBE_R) {
        if (G.invuln > 0) p.x = r.L + TUBE_R + 2;
        else die('撞上岸了');
      } else if (p.x > r.R - TUBE_R) {
        if (G.invuln > 0) p.x = r.R - TUBE_R - 2;
        else die('撞上岸了');
      }
    }

    G.cam = lerp(G.cam, p.wy, 1 - Math.pow(0.0012, dt));
    let psy = playerSY();
    if (psy < 168) G.cam = p.wy - (PLAYER_SY - 168);
    if (psy > 620) G.cam = p.wy - (PLAYER_SY - 620);

    if (G.mode === 'play' && G.deadT <= 0 && p.wy - G.stageStart >= st.len) {
      advanceStage();
    }
  }

  function updateFx(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.28) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.42) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      if (f.t > f.life) floats.splice(i, 1);
    }
    for (let i = wakes.length - 1; i >= 0; i--) {
      wakes[i].t += dt;
      wakes[i].y += 40 * dt;
      if (wakes[i].t > 0.4) wakes.splice(i, 1);
    }
    for (let i = 0; i < foams.length; i++) {
      const f = foams[i];
      f.y += (G.player.vwy * 0.35 + f.s) * dt;
      if (f.y > VH + 8) {
        f.y = -8;
        f.x = rand(30, VW - 30);
      }
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    G.punch = lerp(G.punch, 1, 1 - Math.pow(0.0004, dt));
    if (G.throwKick > 0) G.throwKick = Math.max(0, G.throwKick - dt);
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0 && toastEl) toastEl.classList.add('hidden');
    }
    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.invuln > 0) G.invuln -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
      }
    }
  }

  function update(dt) {
    G.clock += dt;
    G.t += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.25);
      return;
    }
    if (G.mode === 'winfall') {
      G.winT -= dt;
      updatePlayer(dt);
      updateFx(dt);
      spawnTick();
      if (G.winT <= 0) finishWin();
      return;
    }
    if (G.mode === 'title') {
      updatePlayer(dt);
      spawnTick();
      updateEnts(dt);
      updateFx(dt);
      return;
    }
    if (G.mode !== 'play') {
      updateFx(dt);
      return;
    }
    if (G.deadT > 0) {
      G.deadT -= dt;
      updatePlayer(dt);
      updateFx(dt);
      if (G.deadT <= 0) respawn();
      return;
    }
    updatePlayer(dt);
    spawnTick();
    updateShots(dt);
    updateEnts(dt);
    updateFx(dt);
  }

  function roundRect(x, y, w, h, r) {
    const rr = Math.min(r, w * 0.5, h * 0.5);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function drawRiver() {
    ctx.fillStyle = '#071820';
    ctx.fillRect(0, 0, VW, VH);

    const step = 5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let y = -8; y <= VH + 10; y += step) {
      const r = riverAt(worldY(y));
      ctx.lineTo(r.L, y);
    }
    ctx.lineTo(0, VH + 10);
    ctx.closePath();
    ctx.fillStyle = '#0c2a32';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(VW, 0);
    for (let y = -8; y <= VH + 10; y += step) {
      const r = riverAt(worldY(y));
      ctx.lineTo(r.R, y);
    }
    ctx.lineTo(VW, VH + 10);
    ctx.closePath();
    ctx.fillStyle = '#0c2a32';
    ctx.fill();

    const grd = ctx.createLinearGradient(0, 0, 0, VH);
    grd.addColorStop(0, '#0a4a56');
    grd.addColorStop(0.45, '#083844');
    grd.addColorStop(1, '#062830');
    ctx.fillStyle = grd;
    ctx.beginPath();
    const r0 = riverAt(worldY(-8));
    ctx.moveTo(r0.L, -8);
    for (let y = -8; y <= VH + 10; y += step) {
      const r = riverAt(worldY(y));
      ctx.lineTo(r.L, y);
    }
    for (let y = VH + 10; y >= -8; y -= step) {
      const r = riverAt(worldY(y));
      ctx.lineTo(r.R, y);
    }
    ctx.closePath();
    ctx.fill();

    ctx.lineWidth = 2.2;
    ctx.strokeStyle = rgba(CYN, 0.72);
    ctx.beginPath();
    for (let y = -8; y <= VH + 10; y += step) {
      const r = riverAt(worldY(y));
      if (y === -8) ctx.moveTo(r.L, y);
      else ctx.lineTo(r.L, y);
    }
    ctx.stroke();
    ctx.beginPath();
    for (let y = -8; y <= VH + 10; y += step) {
      const r = riverAt(worldY(y));
      if (y === -8) ctx.moveTo(r.R, y);
      else ctx.lineTo(r.R, y);
    }
    ctx.stroke();

    ctx.strokeStyle = rgba(ICE, 0.16);
    ctx.lineWidth = 1;
    const t = G.clock;
    for (let k = 0; k < 5; k++) {
      ctx.beginPath();
      let pen = false;
      for (let y = 0; y <= VH; y += 8) {
        const r = riverAt(worldY(y));
        const wave = Math.sin(y * 0.04 + t * 2.2 + k * 1.3) * 7
          + Math.sin(y * 0.01 + t * 0.8 + k) * 5;
        const x = r.cx + wave + (k - 2) * r.w * 0.12;
        if (x > r.L + 8 && x < r.R - 8) {
          if (!pen) {
            ctx.moveTo(x, y);
            pen = true;
          } else ctx.lineTo(x, y);
        } else pen = false;
      }
      ctx.stroke();
    }

    for (let y = 12; y < VH; y += 28) {
      const wy = worldY(y);
      const r = riverAt(wy);
      const h = hash2((wy * 0.2) | 0);
      if (h > 0.55) {
        const left = h > 0.77;
        const bx = left ? r.L - 8 : r.R + 8;
        ctx.strokeStyle = rgba(TEAL, 0.35 + h * 0.25);
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(bx, y + 10);
        ctx.quadraticCurveTo(bx + (left ? -6 : 6), y - 4, bx + (left ? -2 : 2), y - 14);
        ctx.stroke();
      }
    }

    const st = curStage();
    if (st.falls) {
      const local = G.player.wy - G.stageStart;
      const near = clamp((local - (st.len - 700)) / 700, 0, 1);
      if (near > 0) {
        const mist = ctx.createLinearGradient(0, 0, 0, 160);
        mist.addColorStop(0, rgba(WHT, 0.18 * near));
        mist.addColorStop(1, rgba(ICE, 0));
        ctx.fillStyle = mist;
        ctx.fillRect(0, 0, VW, 180);
        ctx.fillStyle = rgba(GOLD, 0.08 * near);
        ctx.fillRect(0, 0, VW, 24);
      }
    }
  }

  function drawWakes() {
    for (let i = 0; i < wakes.length; i++) {
      const w = wakes[i];
      const a = 1 - w.t / 0.4;
      ctx.strokeStyle = rgba(FOAM, 0.35 * a);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(w.x, w.y, 8 + w.t * 28, 3 + w.t * 6, 0, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < foams.length; i++) {
      const f = foams[i];
      const r = riverAt(worldY(f.y));
      if (f.x < r.L + 6 || f.x > r.R - 6) continue;
      ctx.fillStyle = rgba(FOAM, f.a);
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, TAU);
      ctx.fill();
    }
  }

  function drawEnts() {
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      const y = screenY(e.wy);
      if (y < -40 || y > VH + 40) continue;
      if (e.kind === 'rock') {
        ctx.save();
        ctx.translate(e.x, y);
        ctx.rotate(e.ang);
        ctx.beginPath();
        ctx.moveTo(e.pts[0][0], e.pts[0][1]);
        for (let k = 1; k < e.pts.length; k++) ctx.lineTo(e.pts[k][0], e.pts[k][1]);
        ctx.closePath();
        ctx.fillStyle = e.big ? '#1a2c38' : '#16303a';
        ctx.fill();
        ctx.strokeStyle = rgba(e.big ? ICE : CYN, 0.85);
        ctx.lineWidth = e.big ? 1.8 : 1.4;
        ctx.stroke();
        ctx.restore();
      } else if (e.kind === 'log') {
        ctx.save();
        ctx.translate(e.x, y);
        ctx.rotate(e.ang);
        roundRect(-e.w * 0.5, -e.h * 0.5, e.w, e.h, 4);
        ctx.fillStyle = '#3a2418';
        ctx.fill();
        ctx.strokeStyle = rgba(PNK, 0.75);
        ctx.lineWidth = 1.3;
        ctx.stroke();
        ctx.strokeStyle = rgba(GOLD, 0.25);
        ctx.beginPath();
        ctx.moveTo(-e.w * 0.25, -e.h * 0.2);
        ctx.lineTo(-e.w * 0.25, e.h * 0.2);
        ctx.moveTo(e.w * 0.2, -e.h * 0.2);
        ctx.lineTo(e.w * 0.2, e.h * 0.2);
        ctx.stroke();
        ctx.restore();
      } else if (e.kind === 'gator') {
        const jaw = 3 + e.snap * 5;
        ctx.save();
        ctx.translate(e.x, y);
        ctx.scale(e.dir, 1);
        ctx.fillStyle = '#0d3a28';
        ctx.beginPath();
        ctx.ellipse(0, 0, 18, 7, 0, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = rgba(GOLD, 0.8);
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = rgba(MAG, 0.9);
        ctx.beginPath();
        ctx.moveTo(12, -1);
        ctx.lineTo(22, -jaw);
        ctx.lineTo(22, jaw);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = GOLD;
        ctx.beginPath();
        ctx.arc(6, -3, 1.6, 0, TAU);
        ctx.fill();
        ctx.restore();
      } else if (e.kind === 'whirl') {
        ctx.save();
        ctx.translate(e.x, y);
        ctx.rotate(e.ang);
        ctx.strokeStyle = rgba(CYN, 0.55);
        ctx.lineWidth = 1.6;
        for (let k = 0; k < 3; k++) {
          ctx.beginPath();
          for (let a = 0; a < 9; a++) {
            const ang = a * 0.7;
            const rr = 4 + k * 7 + a * 1.4;
            const px = Math.cos(ang) * rr;
            const py = Math.sin(ang) * rr;
            if (a === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
        }
        ctx.fillStyle = rgba(ICE, 0.35);
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, TAU);
        ctx.fill();
        ctx.restore();
      } else if (e.kind === 'gate') {
        const hw = e.w * 0.5;
        ctx.strokeStyle = rgba(e.passed ? TEAL : GOLD, e.passed ? 0.35 : 0.9);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(e.x - hw, y);
        ctx.lineTo(e.x + hw, y);
        ctx.stroke();
        ctx.fillStyle = rgba(e.passed ? TEAL : GOLD, 0.95);
        ctx.beginPath();
        ctx.arc(e.x - hw, y, 6, 0, TAU);
        ctx.arc(e.x + hw, y, 6, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = rgba(WHT, 0.7);
        ctx.lineWidth = 1.2;
        ctx.stroke();
        if (!e.passed) {
          ctx.fillStyle = rgba(GOLD, 0.85);
          ctx.font = 'bold 11px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText('过', e.x, y - 8);
        }
      } else if (e.kind === 'pack') {
        const bob = Math.sin(e.bob) * 2.5;
        ctx.save();
        ctx.translate(e.x, y + bob);
        ctx.fillStyle = rgba(GOLD, 0.95);
        roundRect(-5, -7, 10, 14, 2);
        ctx.fill();
        ctx.strokeStyle = rgba(CYN, 0.8);
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.fillStyle = rgba(MAG, 0.9);
        ctx.fillRect(-3, -4, 6, 3);
        ctx.restore();
      }
    }
  }

  function drawShots() {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      const y = screenY(s.wy);
      ctx.save();
      ctx.translate(s.x, y);
      ctx.rotate(s.rot);
      roundRect(-3.2, -6, 6.4, 12, 1.6);
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.fill();
      ctx.strokeStyle = rgba(CYN, 0.8);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = rgba(MAG, 0.85);
      ctx.fillRect(-2, -3, 4, 2.4);
      ctx.restore();
    }
  }

  function drawTube() {
    if (G.mode === 'play' && G.deadT > 0) {
      const psy = playerSY();
      ctx.fillStyle = rgba(MAG, 0.35);
      ctx.beginPath();
      ctx.arc(G.player.x, psy, 10 + (0.88 - G.deadT) * 40, 0, TAU);
      ctx.fill();
      return;
    }
    const p = G.player;
    const y = playerSY();
    const blink = G.invuln > 0 && ((G.invuln * 12) | 0) % 2 === 0;
    if (blink && G.mode === 'play') ctx.globalAlpha = 0.4;

    const squash = G.punch;
    const kickY = G.throwKick * 6;
    ctx.save();
    ctx.translate(p.x, y + kickY);
    ctx.scale(squash, 2 - squash);

    ctx.fillStyle = rgba(FOAM, 0.18);
    ctx.beginPath();
    ctx.ellipse(0, 10, 16, 5, 0, 0, TAU);
    ctx.fill();

    ctx.lineWidth = 5.2;
    ctx.strokeStyle = '#ff3db8';
    ctx.beginPath();
    ctx.ellipse(0, 2, 15, 9.5, 0, 0, TAU);
    ctx.stroke();
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = rgba(ICE, 0.95);
    ctx.stroke();

    ctx.fillStyle = '#082028';
    ctx.beginPath();
    ctx.ellipse(0, 2, 7.5, 4.6, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.beginPath();
    ctx.arc(0, -2.2, 4.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#031016';
    ctx.fillRect(-3.4, -3.4, 6.8, 1.5);

    const stroke = Math.sin(G.paddleT * 14) * 0.55;
    const px1 = -16;
    const py1 = 4 + stroke * 6;
    const px2 = 16;
    const py2 = 4 - stroke * 6;
    ctx.strokeStyle = rgba(ICE, 0.9);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-6, 3);
    ctx.lineTo(px1, py1);
    ctx.moveTo(6, 3);
    ctx.lineTo(px2, py2);
    ctx.stroke();
    ctx.fillStyle = rgba(CYN, 0.85);
    ctx.beginPath();
    ctx.ellipse(px1, py1, 4.5, 2.2, -0.4, 0, TAU);
    ctx.ellipse(px2, py2, 4.5, 2.2, 0.4, 0, TAU);
    ctx.fill();

    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawFx() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (0.5 + a * 0.5), 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const a = 1 - s.t / 0.28;
      ctx.strokeStyle = rgba(s.rgb, a);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.rad * (0.4 + s.t * 4), 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const s = rings[i];
      const a = 1 - s.t / 0.42;
      ctx.strokeStyle = rgba(s.rgb, a * 0.85);
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r + s.t * 70, 0, TAU);
      ctx.stroke();
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      ctx.font = 'bold ' + f.size + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
      ctx.fillStyle = rgba(f.rgb, a);
      ctx.fillText(f.text, f.x, f.y);
    }
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.45);
    ctx.fillRect(0, 0, VW, VH);
  }

  function draw() {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#031016';
    ctx.fillRect(0, 0, W, H);

    const shx = G.shake && !REDUCE ? rand(-G.shake, G.shake) * 1.1 : 0;
    const shy = G.shake && !REDUCE ? rand(-G.shake, G.shake) * 0.8 : 0;

    const punch = REDUCE ? 1 : G.punch;
    ctx.save();
    ctx.beginPath();
    ctx.rect(ox, oy, VW * scale, VH * scale);
    ctx.clip();
    ctx.translate(ox + shx + VW * scale * 0.5, oy + shy + VH * scale * 0.5);
    ctx.scale(scale * punch, scale * punch);
    ctx.translate(-VW * 0.5, -VH * 0.5);

    drawRiver();
    drawWakes();
    drawEnts();
    drawShots();
    drawTube();
    drawFx();
    drawFlash();
    ctx.restore();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function pointerToVirtual(e) {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    return {
      x: (x - ox) / scale,
      y: (y - oy) / scale
    };
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

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('flow');
    else startGame(G.kind || 'flow');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') {
      startGame('flow');
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function onKey(e, down) {
    const code = e.code || '';
    const k = e.key;
    const left = code === 'KeyA' || code === 'ArrowLeft';
    const right = code === 'KeyD' || code === 'ArrowRight';
    const up = code === 'KeyW' || code === 'ArrowUp';
    const downK = code === 'KeyS' || code === 'ArrowDown';
    const space = code === 'Space' || k === ' ';
    if (down && (left || right || up || downK || space || k === 'Enter')) e.preventDefault();

    if (left) keys.l = down;
    if (right) keys.r = down;
    if (up) keys.u = down;
    if (downK) keys.d = down;

    if (!down) return;

    if (code === 'KeyM') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (code === 'KeyR') {
      restart();
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      if (G.mode === 'play') throwCan();
    }
    if ((k === '1' || code === 'Digit1') && overlayOpen() && G.mode === 'title') {
      startGame('flow');
    }
    if ((k === '2' || code === 'Digit2') && overlayOpen() && G.mode === 'title') {
      startGame('rapids');
    }
  }

  function holdPad(el, press, release) {
    if (!el) return;
    let held = false;
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      audio.ensure();
      if (padsEl) {
        padsEl.classList.add('show');
        padsEl.setAttribute('aria-hidden', 'false');
      }
      held = true;
      el.classList.add('on');
      if (el.setPointerCapture) {
        try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
      press();
    });
    function up() {
      if (!held) return;
      held = false;
      el.classList.remove('on');
      if (release) release();
    }
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('lostpointercapture', up);
  }

  function bindPads() {
    holdPad(padL, function () { keys.l = true; }, function () { keys.l = false; });
    holdPad(padR, function () { keys.r = true; }, function () { keys.r = false; });
    holdPad(padU, function () { keys.u = true; }, function () { keys.u = false; });
    holdPad(padD, function () { keys.d = true; }, function () { keys.d = false; });
    holdPad(padThrow, function () { throwCan(); }, null);
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

  seedFoam();
  loadBest();
  initMute();
  goTitle();
  resize();
  bindPads();

  if (btnFlow) {
    btnFlow.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
      else startGame('flow');
    });
  }
  if (btnRapids) {
    btnRapids.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose' || G.mode === 'win') goTitle();
      else startGame('rapids');
    });
  }
  if (btnRetry) btnRetry.addEventListener('click', restart);
  if (btnMute) {
    btnMute.addEventListener('click', function () {
      audio.ensure();
      audio.setMuted(!audio.muted);
    });
  }

  if (canvas) {
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      if (e.button != null && e.button !== 0) return;
      if (e.pointerType === 'touch' && padsEl) {
        padsEl.classList.add('show');
        padsEl.setAttribute('aria-hidden', 'false');
      }
      if (overlayOpen()) {
        if (e.pointerType !== 'touch') primaryAction();
        return;
      }
      if (G.mode !== 'play') return;
      const v = pointerToVirtual(e);
      pointer.down = true;
      pointer.id = e.pointerId;
      pointer.x = v.x;
      pointer.y = v.y;
      pointer.t0 = performance.now();
      pointer.x0 = v.x;
      pointer.y0 = v.y;
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!pointer.down || pointer.id !== e.pointerId) return;
      const v = pointerToVirtual(e);
      pointer.x = v.x;
      pointer.y = v.y;
    });
    function ptrUp(e) {
      if (!pointer.down) return;
      if (e && pointer.id != null && e.pointerId != null && e.pointerId !== pointer.id) return;
      const dt = performance.now() - pointer.t0;
      const dist = hypot(pointer.x - pointer.x0, pointer.y - pointer.y0);
      pointer.down = false;
      pointer.id = null;
      if (dt < 220 && dist < 14 && G.mode === 'play') throwCan();
    }
    canvas.addEventListener('pointerup', ptrUp);
    canvas.addEventListener('pointercancel', ptrUp);
    canvas.addEventListener('lostpointercapture', ptrUp);
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
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
      pointer.down = false;
    }
  });

  requestAnimationFrame(frame);
})();
