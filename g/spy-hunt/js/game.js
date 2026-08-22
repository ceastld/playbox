'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const FIELD = 672;
  const PLAYER_SY = 548;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 10000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.4;
  const BEST_KEY = 'playbox-spy-hunt-best';
  const MUTE_KEY = 'playbox-spy-hunt-mute';
  const OPS = '← → / A D 转向 · ↑ 加速 ↓ 减速 · 空格开火 · Q 机油 · W 烟幕 · E 导弹 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const MINT = [50, 255, 122];
  const LEAF = [30, 224, 96];
  const HOT = [122, 255, 176];
  const WHT = [246, 248, 252];
  const PNK = [255, 154, 212];
  const ORG = [255, 168, 74];
  const RED = [255, 72, 88];
  const ASH = [186, 204, 214];
  const OILC = [28, 18, 42];
  const BLU = [80, 150, 255];

  const CIV_RGB = [GOLD, BLU, WHT, [120, 210, 160], [255, 196, 120]];
  const SCORE = { ram: 220, blade: 360, dump: 260, heli: 700, boat: 240, barrel: 80, bomb: 90 };
  const HW = { player: 9, civ: 8, ram: 9, blade: 10, dump: 10, heli: 16, van: 15, barrel: 7, bomb: 6 };
  const HH = { player: 15, civ: 13, ram: 14, blade: 14, dump: 16, heli: 10, van: 24, barrel: 7, bomb: 6 };

  const ROAD_SEGS = [
    { len: 2800, water: false, name: '国道' },
    { len: 1100, water: true, name: '渡口' },
    { len: 3000, water: false, name: '高速' },
    { len: 1200, water: true, name: '海湾' },
    { len: 3400, water: false, name: '夜港' }
  ];
  let GOAL = 0;
  for (let i = 0; i < ROAD_SEGS.length; i++) GOAL += ROAD_SEGS[i].len;

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: false });
  const overlay = document.getElementById('overlay');
  const panel = document.getElementById('panel');
  const ovKicker = document.getElementById('ov-kicker');
  const ovTitle = document.getElementById('ov-title');
  const ovLead = document.getElementById('ov-lead');
  const ovOps = document.getElementById('ov-ops');
  const btnRoad = document.getElementById('btn-road');
  const btnNight = document.getElementById('btn-night');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnOil = document.getElementById('btn-oil');
  const btnSmoke = document.getElementById('btn-smoke');
  const btnMissile = document.getElementById('btn-missile');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const ammoLabel = document.getElementById('ammo-label');
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
  let kickTok = 0;

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: PLAYER_SY, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const wakes = [];

  const G = {
    mode: 'title',
    kind: 'road',
    t: 0,
    clock: 0,
    alt: 40,
    spd: 180,
    ship: { x: VW * 0.5, vx: 0 },
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    section: 1,
    nextLife: LIFE_EVERY,
    ents: [],
    shots: [],
    miss: [],
    oils: [],
    smokes: [],
    spawnedY: 0,
    lastVan: -800,
    lastHeli: 400,
    fireCd: 0,
    fireHold: false,
    oil: 3,
    smokeN: 3,
    missiles: 2,
    oilCd: 0,
    smokeCd: 0,
    missCd: 0,
    boat: false,
    boardT: 0,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: CYN,
    punch: 1,
    muzzle: 0,
    distAcc: 0,
    toastT: 0,
    why: '',
    winT: 0,
    waterWas: false,
    rotor: 0
  };

  let inputSrc = 'key';

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
  function isNight() {
    return G.kind === 'night';
  }
  function worldToScreenY(wy) {
    return PLAYER_SY - (wy - G.alt);
  }
  function screenToWorldY(syv) {
    return G.alt + (PLAYER_SY - syv);
  }
  function minSpd() {
    return isNight() ? 110 : 86;
  }
  function maxSpd() {
    return isNight() ? 430 : 360;
  }
  function cruise() {
    return isNight() ? 268 : 206;
  }
  function turnSpd() {
    return (isNight() ? 320 : 280) * (G.boat ? 1.08 : 1);
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

  function terrainAt(y) {
    if (y < 0) y = 0;
    if (isNight()) {
      const cyc = 3200;
      const local = ((y % cyc) + cyc) % cyc;
      const stage = 1 + (y / cyc | 0);
      if (local < 2400) {
        return { water: false, name: '夜路', stage: stage, local: local, len: 2400 };
      }
      return { water: true, name: '暗河', stage: stage, local: local - 2400, len: 800 };
    }
    let acc = 0;
    for (let i = 0; i < ROAD_SEGS.length; i++) {
      const s = ROAD_SEGS[i];
      if (y < acc + s.len) {
        return { water: s.water, name: s.name, stage: i + 1, local: y - acc, len: s.len };
      }
      acc += s.len;
    }
    const last = ROAD_SEGS[ROAD_SEGS.length - 1];
    return { water: false, name: last.name, stage: ROAD_SEGS.length, local: last.len, len: last.len };
  }

  function waterAmt(y) {
    const t = terrainAt(y);
    const edge = 140;
    let a = t.water ? 1 : 0;
    if (t.local < edge) {
      const u = t.local / edge;
      const prev = terrainAt(y - t.local - 2);
      if (prev.water !== t.water) a = lerp(prev.water ? 1 : 0, t.water ? 1 : 0, u * u * (3 - 2 * u));
    }
    const tail = t.len - t.local;
    if (tail < edge) {
      const u = 1 - tail / edge;
      const next = terrainAt(y + tail + 2);
      if (next.water !== t.water) a = lerp(t.water ? 1 : 0, next.water ? 1 : 0, u * u * (3 - 2 * u));
    }
    return clamp(a, 0, 1);
  }

  function roadAt(y) {
    const night = isNight();
    const amt = waterAmt(y);
    const n1 = fbm(y * 0.00168, 1);
    const n2 = fbm(y * 0.00062, 7);
    let cx = VW * 0.5 + (n1 - 0.5) * (night ? 96 : 72) + (n2 - 0.5) * 22;
    let wLand = night ? 186 : 216;
    wLand += (fbm(y * 0.0021, 4) - 0.5) * (night ? 28 : 38);
    let wWater = night ? 148 : 164;
    wWater += (fbm(y * 0.0024, 9) - 0.5) * 18;
    let w = lerp(wLand, wWater, amt);
    if (y < 380) {
      const t = 1 - y / 380;
      const e = t * t * (3 - 2 * t);
      cx = lerp(cx, VW * 0.5, e);
      w = lerp(w, night ? 230 : 252, e);
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
    return { L: L, R: R, cx: (L + R) * 0.5, w: R - L, water: amt > 0.55, amt: amt };
  }

  function laneX(r, lane, pick) {
    const inner = r.w - 28;
    const n = 3;
    const w = inner / n;
    const laneN = ((lane % n) + n) % n;
    return r.L + 14 + w * (laneN + 0.5) + (pick - 0.5) * 6;
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
      this.beep(880, 0.05, 'square', 0.032, 1680);
      this.noise(0.03, 0.02, 1800);
    },
    oil() {
      this.ensure();
      this.noise(0.16, 0.055, 220);
      this.beep(140, 0.12, 'sine', 0.04, 70);
    },
    smoke() {
      this.ensure();
      this.noise(0.22, 0.05, 400);
      this.beep(220, 0.14, 'triangle', 0.03, 90);
    },
    missile() {
      this.ensure();
      this.beep(280, 0.18, 'sawtooth', 0.045, 880);
      this.beep(520, 0.1, 'square', 0.03, 1400);
    },
    hit(kind, combo) {
      this.ensure();
      const base = kind === 'heli' ? 920 : kind === 'blade' ? 740 : 520;
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.055, 0.044, 1000);
      this.beep(base * lift, 0.09, 'square', 0.05, base * lift * 1.55);
    },
    boom() {
      this.ensure();
      this.noise(0.16, 0.06, 280);
      this.beep(180, 0.2, 'sawtooth', 0.05, 60);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    miss() {
      this.ensure();
      this.beep(160, 0.07, 'sine', 0.022, 80);
    },
    penalty() {
      this.ensure();
      this.beep(220, 0.1, 'square', 0.04, 110);
      this.beep(140, 0.16, 'sawtooth', 0.035, 70);
    },
    death() {
      this.ensure();
      this.noise(0.16, 0.06, 320);
      this.beep(300, 0.2, 'sawtooth', 0.05, 70);
      this.beep(150, 0.32, 'sine', 0.045, 44);
    },
    van() {
      this.ensure();
      this.beep(392, 0.09, 'sine', 0.04, 523);
      this.beep(659, 0.14, 'triangle', 0.04, 880);
      this.beep(784, 0.18, 'sine', 0.035, 1175);
    },
    splash() {
      this.ensure();
      this.noise(0.12, 0.045, 500);
      this.beep(330, 0.1, 'sine', 0.03, 180);
    },
    up() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.045, 784);
      this.beep(784, 0.12, 'triangle', 0.04, 1046);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.04, 784);
      this.beep(659, 0.14, 'triangle', 0.04, 988);
      this.beep(784, 0.22, 'sine', 0.04, 1175);
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
    empty() {
      this.ensure();
      this.beep(180, 0.08, 'square', 0.028, 90);
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
    if (G.mode !== 'play' || n <= 0) return;
    G.score += n;
    if (scoreEl) scoreEl.textContent = String(G.score);
    saveBest();
    if (G.score >= G.nextLife) {
      G.nextLife += LIFE_EVERY;
      if (G.lives < LIFE_CAP) {
        G.lives += 1;
        toast('1UP', false, true);
        audio.up();
        syncPips();
      }
    }
    popScoreAdd('+' + n, false);
  }

  function takeScore(n) {
    if (G.mode !== 'play' || n <= 0) return;
    G.score = Math.max(0, G.score - n);
    if (scoreEl) scoreEl.textContent = String(G.score);
    popScoreAdd('-' + n, true);
  }

  function popScoreAdd(text, neg) {
    if (!scoreBox || !scoreAdd) return;
    scoreBox.classList.remove('flash');
    void scoreBox.offsetWidth;
    scoreBox.classList.add('flash');
    addTok += 1;
    const tok = addTok;
    scoreAdd.hidden = false;
    scoreAdd.textContent = text;
    scoreAdd.classList.toggle('neg', !!neg);
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

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    const ter = terrainAt(G.alt);
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '追猎';
      else stageLabel.textContent = ter.name;
      stageLabel.classList.toggle('hot', G.mode === 'play' && (ter.stage >= 4 || G.boat));
    }
    if (tagLabel) {
      let tag = isNight() ? '夜追' : '公路';
      if (G.mode === 'play' && G.boat) tag = '快艇';
      tagLabel.textContent = tag;
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1);
      tagLabel.classList.toggle('hot', G.combo >= 8);
      tagLabel.classList.toggle('boat', G.boat && G.mode === 'play');
    }
    if (ammoLabel) {
      ammoLabel.textContent = '油 ' + G.oil + ' · 烟 ' + G.smokeN + ' · 弹 ' + G.missiles;
      ammoLabel.classList.toggle('low', G.oil + G.smokeN + G.missiles <= 2);
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
    else if (G.mode === 'lose') setHint('R 重开 · 敌车会撞你，别打平民', 'warn');
    else if (G.mode === 'win') setHint('任务完成 · R 再跑一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 补给车补弹 · 别打平民', 'warn');
    else if (G.boat) setHint('快艇 · 空格开火 · 别冲出水道', 'hot');
    else setHint('← → 转向 · 空格开火 · Q 机油 W 烟幕 E 导弹', '');
    syncPips();
  }

  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }

  function showOverlay(kind, title, lead, primary, secondary) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'SPY';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    if (btnRoad) btnRoad.textContent = primary;
    if (btnNight) {
      btnNight.classList.toggle('hidden', !secondary);
      if (secondary) btnNight.textContent = secondary;
    }
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
    if (REDUCE || G.mode !== 'play') return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.045, mag * 0.006));
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
        g: spec.g == null ? 420 : spec.g
      });
    }
    capArr(particles, 300);
  }

  function popSpark(x, y, rgb, rad) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb, rad: rad || 16 });
    rings.push({ x: x, y: y, t: 0, rgb: rgb, r: rad || 14 });
    capArr(sparks, 36);
    capArr(rings, 22);
  }

  function floatText(x, y, text, rgb, gold) {
    floats.push({
      x: x, y: y, text: text, rgb: rgb,
      t: 0, life: gold ? 0.95 : 0.65,
      size: gold ? 20 : 15, gold: !!gold, vy: gold ? -90 : -72
    });
    capArr(floats, 24);
  }

  function explode(x, y, rgb, power) {
    const p = power || 18;
    emit(Math.min(30, 10 + (p * 0.5) | 0), {
      x: x, y: y, j: 6,
      vx0: -200, vx1: 200, vy0: -90, vy1: 240,
      r0: 1.4, r1: 4.4, life: 0.42 + p * 0.006, rgb: rgb, g: 520
    });
    emit(6, {
      x: x, y: y, j: 3,
      vx0: -70, vx1: 70, vy0: 40, vy1: 150,
      r0: 2, r1: 5, life: 0.28, rgb: WHT, g: 200
    });
    popSpark(x, y, rgb, 12 + p * 0.4);
  }

  function bumpCombo() {
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
      }
    }
  }

  function breakCombo() {
    G.combo = 0;
    G.mult = 1;
    G.comboT = 0;
  }

  function occupied(y, x, rad) {
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      if (Math.abs(e.y - y) < 46 && Math.abs(e.x - x) < rad) return true;
    }
    return false;
  }

  function isEnemy(e) {
    return e.type === 'ram' || e.type === 'blade' || e.type === 'dump' || e.type === 'heli';
  }

  function trySpawn(y) {
    if (y < 420) return;
    const ter = terrainAt(y);
    const r = roadAt(y);
    const slice = (y / 52) | 0;
    const h = hash2(slice * 13 + (isNight() ? 91 : 7));
    const dens = (y < 900 ? 0.42 : y < 2200 ? 0.72 : 1) * (isNight() ? 1.28 : 1);
    const water = r.water;

    if (!water && y - G.lastVan > (isNight() ? 1500 : 2200) && h > 0.82 && r.w > 140) {
      const lx = laneX(r, 1, 0.5);
      if (!occupied(y, lx, 40)) {
        G.lastVan = y;
        pushEnt({
          type: 'van', x: lx, y: y, spd: cruise() * 0.72, vx: 0,
          alive: true, hw: HW.van, hh: HH.van, hp: 3, used: false, ramp: 0,
          boat: false, spin: 0, blind: 0, dropT: 0, blade: 0, rgb: WHT, lane: 1
        });
        return;
      }
    }

    if (!water && y > (isNight() ? 900 : 1700) && y - G.lastHeli > (isNight() ? 2100 : 2800) && hash2(slice * 3 + 19) > 0.88) {
      G.lastHeli = y;
      pushEnt({
        type: 'heli', x: r.cx, y: y, spd: cruise() * 0.2, vx: 0,
        alive: true, hw: HW.heli, hh: HH.heli, hp: 3, used: false, ramp: 0,
        boat: false, spin: 0, blind: 0, dropT: 1.2, blade: 0, rgb: GOLD, lane: 1
      });
    }

    if (h > 0.52 * dens) return;
    if (r.w < 88) return;

    const u = hash2(slice * 29 + 3);
    let type = 'civ';
    if (u < (isNight() ? 0.38 : 0.28)) type = 'ram';
    else if (u < (isNight() ? 0.52 : 0.38)) type = 'blade';
    else if (u < (isNight() ? 0.62 : 0.46) && !water) type = 'dump';
    if (y < 760 && type !== 'civ') type = 'civ';
    if (water && type === 'dump') type = 'ram';

    const lane = (hash2(slice * 41 + 11) * 3) | 0;
    const pick = hash2(slice * 17 + 5);
    const x = laneX(r, lane, pick);
    if (occupied(y, x, 34)) return;

    const base = cruise();
    let spd = base + (pick - 0.55) * 70;
    if (type === 'civ') spd = base * (0.72 + pick * 0.28);
    if (type === 'ram') spd = base * (0.88 + pick * 0.18);
    if (type === 'dump') spd = base * 0.84;

    const rgb = type === 'civ'
      ? CIV_RGB[(hash2(slice * 7 + 2) * CIV_RGB.length) | 0]
      : type === 'blade' ? PNK : type === 'dump' ? ORG : MAG;

    pushEnt({
      type: type,
      x: x,
      y: y,
      spd: spd,
      vx: 0,
      alive: true,
      hw: HW[type] || 8,
      hh: HH[type] || 13,
      hp: type === 'civ' ? 1 : type === 'blade' ? 2 : type === 'dump' ? 2 : 2,
      used: false,
      ramp: 0,
      boat: water,
      spin: 0,
      blind: 0,
      dropT: type === 'dump' ? 0.8 + pick : 0,
      blade: 0,
      rgb: rgb,
      lane: lane,
      phase: pick * TAU
    });
  }

  function pushEnt(e) {
    G.ents.push(e);
  }

  function ensureWorld() {
    const ahead = G.alt + PLAYER_SY + 380;
    while (G.spawnedY < ahead) {
      G.spawnedY += 52;
      trySpawn(G.spawnedY);
    }
    const behind = G.alt - 220;
    let w = 0;
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      const syy = worldToScreenY(e.y);
      const keep = e.alive && e.y > behind && syy > -90 && syy < FIELD + 140;
      if (keep) G.ents[w++] = e;
    }
    G.ents.length = w;
  }

  function resetRun() {
    G.alt = 48;
    G.spd = cruise();
    G.ship.x = VW * 0.5;
    G.ship.vx = 0;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.section = 1;
    G.nextLife = LIFE_EVERY;
    G.ents.length = 0;
    G.shots.length = 0;
    G.miss.length = 0;
    G.oils.length = 0;
    G.smokes.length = 0;
    G.spawnedY = 0;
    G.lastVan = -400;
    G.lastHeli = 200;
    G.fireCd = 0;
    G.oil = 3;
    G.smokeN = 3;
    G.missiles = 2;
    G.oilCd = 0;
    G.smokeCd = 0;
    G.missCd = 0;
    G.boat = false;
    G.boardT = 0;
    G.deadT = 0;
    G.invuln = 0.45;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.muzzle = 0;
    G.distAcc = 0;
    G.why = '';
    G.winT = 0;
    G.waterWas = false;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    wakes.length = 0;
    if (scoreEl) scoreEl.textContent = '0';
    ensureWorld();
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'road';
    resetRun();
    G.invuln = 99;
    G.spd = 120;
    showOverlay(
      'title',
      '追猎',
      '公路上车里开火。扫敌车，别打平民。开进补给车补弹，水面会变成快艇。',
      '公路',
      '夜追'
    );
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'night' ? 'night' : 'road';
    G.mode = 'play';
    resetRun();
    hideOverlay();
    audio.start();
    toast(isNight() ? '夜追 · 更快更密' : '公路 · 过段登艇', false, !isNight());
    syncHud();
  }

  function loseRun() {
    G.mode = 'lose';
    saveBest();
    audio.lose();
    const why = G.why || '追丢了';
    showOverlay('lose', '追丢了', why + '  ·  分数 ' + G.score, '再来', '换模式');
    setHint('R 重开', 'warn');
    syncHud();
  }

  function winRun() {
    G.score += 2500;
    if (scoreEl) scoreEl.textContent = String(G.score);
    saveBest();
    G.mode = 'win';
    audio.win();
    showOverlay('win', '任务完成', '公路肃清  ·  分数 ' + G.score, '再来', '夜追');
    setHint('R 再跑', 'hot');
    syncHud();
  }

  function respawn() {
    const r = roadAt(G.alt);
    G.ship.x = r.cx;
    G.ship.vx = 0;
    G.spd = cruise();
    G.invuln = 1.4;
    G.shots.length = 0;
    G.miss.length = 0;
    G.boardT = 0;
    breakCombo();
    toast('剩余 ' + G.lives + ' 命', true, false);
    syncHud();
  }

  function killPlayer(why) {
    if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0 || G.boardT > 0) return;
    G.why = why;
    G.deadT = 0.92;
    G.lives -= 1;
    breakCombo();
    explode(G.ship.x, G.alt, MAG, 34);
    emit(16, {
      x: G.ship.x, y: G.alt, j: 8,
      vx0: -240, vx1: 240, vy0: -50, vy1: 260,
      r0: 2, r1: 5.5, life: 0.55, rgb: CYN, g: 380
    });
    audio.death();
    hitStop(0.074);
    kick(8);
    screenFlash(MAG, 0.58);
    G.shots.length = 0;
    syncPips();
  }

  function award(kind, x, y) {
    bumpCombo();
    const n = (SCORE[kind] || 120) * G.mult;
    addScore(n);
    floatText(x, y + 8, '+' + n, G.mult >= 3 ? GOLD : WHT, kind === 'heli' || G.mult >= 3);
  }

  function destroy(e, silent) {
    if (!e.alive) return;
    e.alive = false;
    if (e.type === 'civ') {
      explode(e.x, e.y, e.rgb || GOLD, 16);
      return;
    }
    if (e.type === 'van') {
      explode(e.x, e.y, GOLD, 22);
      audio.boom();
      toast('补给车被毁', true, false);
      takeScore(250);
      floatText(e.x, e.y, '-250', MAG, false);
      breakCombo();
      return;
    }
    const rgb = e.type === 'heli' ? GOLD : e.type === 'blade' ? PNK : MAG;
    explode(e.x, e.y, rgb, e.type === 'heli' ? 26 : 16);
    if (!silent) {
      const k = e.boat && e.type !== 'heli' ? 'boat' : e.type;
      award(k, e.x, e.y);
      audio.hit(e.type, G.combo);
      hitStop(clamp(0.034 + G.combo * 0.003, 0.034, 0.062));
      kick(3.4);
      screenFlash(rgb, 0.28);
    }
  }

  function hurt(e) {
    if (!e.alive) return;
    if (e.type === 'civ') {
      destroy(e, true);
      breakCombo();
      takeScore(400);
      floatText(e.x, e.y, '-400', MAG, false);
      toast('误伤平民', true, false);
      audio.penalty();
      hitStop(0.05);
      kick(4);
      screenFlash(MAG, 0.42);
      return;
    }
    if (e.type === 'van') {
      e.hp -= 1;
      popSpark(e.x, e.y, GOLD, 12);
      audio.penalty();
      if (e.hp <= 0) destroy(e, true);
      else {
        e.used = true;
        toast('补给车受袭', true, false);
      }
      return;
    }
    if (e.type === 'barrel' || e.type === 'bomb') {
      e.alive = false;
      explode(e.x, e.y, ORG, 12);
      award(e.type, e.x, e.y);
      audio.hit('ram', G.combo);
      hitStop(0.03);
      kick(2);
      return;
    }
    e.hp -= 1;
    popSpark(e.x, e.y, WHT, 10);
    emit(5, {
      x: e.x, y: e.y, j: 4,
      vx0: -80, vx1: 80, vy0: -40, vy1: 80,
      r0: 1, r1: 2.4, life: 0.18, rgb: WHT, g: 200
    });
    if (e.hp <= 0) destroy(e, false);
    else audio.hit(e.type, G.combo);
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0 || G.boardT > 0) return;
    if (overlayOpen()) return;
    if (G.shots.length >= 10) return;
    if (G.fireCd > 0) return;
    const vy = G.spd + 540;
    G.shots.push({ x: G.ship.x - 5.2, y: G.alt + 16, vy: vy, trail: [] });
    G.shots.push({ x: G.ship.x + 5.2, y: G.alt + 16, vy: vy, trail: [] });
    G.fireCd = 0.082;
    audio.shoot();
    screenFlash(CYN, 0.14);
    G.muzzle = 0.07;
    emit(6, {
      x: G.ship.x, y: G.alt + 18, j: 3,
      vx0: -50, vx1: 50, vy0: 80, vy1: 200,
      r0: 1, r1: 2.4, life: 0.14, rgb: CYN, g: 0
    });
  }

  function dropOil() {
    if (G.mode !== 'play' || G.deadT > 0 || G.boardT > 0) return;
    if (overlayOpen()) return;
    if (G.oilCd > 0) return;
    if (G.oil <= 0) {
      G.oilCd = 0.35;
      toast('机油用尽', true, false);
      audio.empty();
      return;
    }
    G.oil -= 1;
    G.oilCd = 0.5;
    G.oils.push({ x: G.ship.x, y: G.alt - 30, w: 32, life: 5.4, t: 0 });
    audio.oil();
    emit(10, {
      x: G.ship.x, y: G.alt - 24, j: 8,
      vx0: -40, vx1: 40, vy0: -30, vy1: 40,
      r0: 2, r1: 5, life: 0.45, rgb: OILC, g: 80
    });
    emit(4, {
      x: G.ship.x, y: G.alt - 24, j: 6,
      vx0: -20, vx1: 20, vy0: -10, vy1: 20,
      r0: 1.2, r1: 2.4, life: 0.3, rgb: MAG, g: 40
    });
    kick(1.6);
    syncHud();
  }

  function dropSmoke() {
    if (G.mode !== 'play' || G.deadT > 0 || G.boardT > 0) return;
    if (overlayOpen()) return;
    if (G.smokeCd > 0) return;
    if (G.smokeN <= 0) {
      G.smokeCd = 0.35;
      toast('烟幕用尽', true, false);
      audio.empty();
      return;
    }
    G.smokeN -= 1;
    G.smokeCd = 0.52;
    for (let i = 0; i < 9; i++) {
      G.smokes.push({
        x: G.ship.x + rand(-10, 10),
        y: G.alt - 16 - i * 7,
        r: 9 + i * 1.2,
        life: 1.7,
        t: 0
      });
    }
    audio.smoke();
    emit(8, {
      x: G.ship.x, y: G.alt - 18, j: 10,
      vx0: -50, vx1: 50, vy0: -40, vy1: 30,
      r0: 3, r1: 7, life: 0.5, rgb: ASH, g: 30
    });
    kick(1.4);
    syncHud();
  }

  function nearestEnemy() {
    let best = null;
    let bestD = 1e9;
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive || !isEnemy(e)) continue;
      if (e.y < G.alt - 10) continue;
      const syy = worldToScreenY(e.y);
      if (syy < -30 || syy > PLAYER_SY + 20) continue;
      const d = hypot(e.x - G.ship.x, e.y - G.alt);
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    }
    return best;
  }

  function fireMissile() {
    if (G.mode !== 'play' || G.deadT > 0 || G.boardT > 0) return;
    if (overlayOpen()) return;
    if (G.missCd > 0) return;
    if (G.missiles <= 0) {
      G.missCd = 0.35;
      toast('导弹用尽', true, false);
      audio.empty();
      return;
    }
    G.missiles -= 1;
    G.missCd = 0.38;
    const target = nearestEnemy();
    G.miss.push({
      x: G.ship.x,
      y: G.alt + 18,
      vx: 0,
      vy: G.spd + 300,
      target: target,
      trail: [],
      life: 2.3
    });
    audio.missile();
    G.muzzle = 0.1;
    screenFlash(MAG, 0.22);
    emit(8, {
      x: G.ship.x, y: G.alt + 16, j: 4,
      vx0: -40, vx1: 40, vy0: 60, vy1: 160,
      r0: 1.4, r1: 3, life: 0.2, rgb: MAG, g: 0
    });
    kick(2.2);
    syncHud();
  }

  function restock(van) {
    if (van.used) return;
    van.used = true;
    van.ramp = 1;
    G.boardT = 0.7;
    G.invuln = Math.max(G.invuln, 1.5);
    G.oil = 3;
    G.smokeN = 3;
    G.missiles = 6;
    addScore(500);
    floatText(van.x, van.y, '+弹药', GOLD, true);
    toast('弹药补满', false, true);
    audio.van();
    hitStop(0.055);
    kick(3);
    screenFlash(GOLD, 0.46);
    syncHud();
  }

  function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
    return Math.abs(ax - bx) < aw + bw && Math.abs(ay - by) < ah + bh;
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      if (!REDUCE) {
        if (!s.trail) s.trail = [];
        s.trail.push({ x: s.x, y: s.y });
        if (s.trail.length > 5) s.trail.shift();
      }
      s.y += s.vy * dt;
      if (worldToScreenY(s.y) < -30) {
        G.shots.splice(i, 1);
        continue;
      }
      let hit = false;
      for (let k = 0; k < G.ents.length; k++) {
        const e = G.ents[k];
        if (!e.alive) continue;
        if (aabb(s.x, s.y, 2.1, 7, e.x, e.y, e.hw, e.hh)) {
          hurt(e);
          hit = true;
          break;
        }
      }
      if (hit) G.shots.splice(i, 1);
    }
  }

  function updateMissiles(dt) {
    for (let i = G.miss.length - 1; i >= 0; i--) {
      const m = G.miss[i];
      m.life -= dt;
      if (m.target && !m.target.alive) m.target = nearestEnemy();
      if (m.target && m.target.alive) {
        const dx = m.target.x - m.x;
        const dy = m.target.y - m.y;
        const d = hypot(dx, dy) || 1;
        const spd = 520;
        m.vx = lerp(m.vx, dx / d * spd, 1 - Math.exp(-dt * 7));
        m.vy = lerp(m.vy, dy / d * spd, 1 - Math.exp(-dt * 7));
      }
      if (!REDUCE) {
        m.trail.push({ x: m.x, y: m.y });
        if (m.trail.length > 8) m.trail.shift();
      }
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      emit(1, {
        x: m.x, y: m.y, j: 1.2,
        vx0: -10, vx1: 10, vy0: -10, vy1: 10,
        r0: 1, r1: 2, life: 0.12, rgb: MAG, g: 0
      });
      let dead = m.life <= 0 || worldToScreenY(m.y) < -40 || m.x < -20 || m.x > VW + 20;
      if (!dead) {
        for (let k = 0; k < G.ents.length; k++) {
          const e = G.ents[k];
          if (!e.alive || e.type === 'civ') continue;
          if (aabb(m.x, m.y, 4, 6, e.x, e.y, e.hw, e.hh)) {
            if (e.type === 'van') hurt(e);
            else {
              e.hp = 0;
              destroy(e, false);
            }
            explode(m.x, m.y, MAG, 20);
            audio.boom();
            dead = true;
            break;
          }
        }
      }
      if (dead) G.miss.splice(i, 1);
    }
  }

  function keepOnRoad(e, y) {
    const r = roadAt(y);
    const m = e.hw + 4;
    if (e.x < r.L + m) {
      e.x = r.L + m;
      e.vx = Math.abs(e.vx);
    }
    if (e.x > r.R - m) {
      e.x = r.R - m;
      e.vx = -Math.abs(e.vx);
    }
  }

  function inSmoke(e) {
    for (let i = 0; i < G.smokes.length; i++) {
      const s = G.smokes[i];
      if (hypot(e.x - s.x, e.y - s.y) < s.r + e.hw) return true;
    }
    return false;
  }

  function inOil(e) {
    for (let i = 0; i < G.oils.length; i++) {
      const o = G.oils[i];
      if (aabb(e.x, e.y, e.hw, e.hh, o.x, o.y, o.w * 0.5, 16)) return true;
    }
    return false;
  }

  function updateEnts(dt) {
    G.rotor += dt * 14;
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      e.boat = roadAt(e.y).water;
      if (e.spin > 0) {
        e.spin -= dt;
        e.x += e.vx * dt;
        e.y += (e.spd * 0.35) * dt;
        e.vx += rand(-80, 80) * dt;
        keepOnRoad(e, e.y);
        e.phase += dt * 14;
        if (e.spin <= 0 && isEnemy(e)) {
          destroy(e, false);
          floatText(e.x, e.y, '打滑', GOLD, false);
        }
        continue;
      }
      if (isEnemy(e) && e.type !== 'heli' && inOil(e)) {
        e.spin = 1.15;
        e.vx = rand(-90, 90);
        audio.oil();
        popSpark(e.x, e.y, MAG, 14);
        continue;
      }
      if (inSmoke(e) && isEnemy(e)) e.blind = Math.max(e.blind, 0.9);
      if (e.blind > 0) e.blind -= dt;

      if (e.type === 'heli') {
        e.y = lerp(e.y, G.alt + 300, 1 - Math.exp(-dt * 1.6));
        const want = G.ship.x + Math.sin(G.t * 1.4) * 18;
        e.x = lerp(e.x, want, 1 - Math.exp(-dt * 1.8));
        e.dropT -= dt;
        if (e.dropT <= 0 && G.mode === 'play') {
          e.dropT = isNight() ? 1.15 : 1.55;
          pushEnt({
            type: 'bomb', x: e.x, y: e.y - 8, spd: G.spd * 0.15, vx: (G.ship.x - e.x) * 0.15,
            alive: true, hw: HW.bomb, hh: HH.bomb, hp: 1, boat: false,
            spin: 0, blind: 0, dropT: 0, blade: 0, rgb: ORG, lane: 0, phase: 0, used: false, ramp: 0
          });
        }
        continue;
      }

      e.y += e.spd * dt;
      e.x += e.vx * dt;

      if (e.type === 'van') {
        if (!e.used && G.mode === 'play' && G.deadT <= 0) {
          const dy = e.y - G.alt;
          if (dy > 10 && dy < 52 && Math.abs(e.x - G.ship.x) < 18) restock(e);
          if (dy > 8 && dy < 140 && Math.abs(e.x - G.ship.x) < 40) e.ramp = Math.min(1, e.ramp + dt * 3);
        }
        keepOnRoad(e, e.y);
        continue;
      }

      if (e.type === 'barrel' || e.type === 'bomb') {
        keepOnRoad(e, e.y);
        continue;
      }

      if (e.type === 'civ') {
        const r = roadAt(e.y);
        const want = laneX(r, e.lane, 0.5);
        e.x = lerp(e.x, want, 1 - Math.exp(-dt * 1.4));
        e.vx *= Math.exp(-dt * 4);
        keepOnRoad(e, e.y);
        continue;
      }

      if (e.blind > 0) {
        e.vx = Math.sin(G.t * 5 + e.phase) * 70;
        keepOnRoad(e, e.y);
        continue;
      }

      if (G.mode !== 'play' || G.deadT > 0) {
        keepOnRoad(e, e.y);
        continue;
      }

      const dx = G.ship.x - e.x;
      const dy = G.alt - e.y;
      if (e.type === 'ram') {
        if (Math.abs(dy) > 70) e.spd = lerp(e.spd, G.spd + (dy > 0 ? 40 : -36), 1 - Math.exp(-dt * 2));
        else e.spd = lerp(e.spd, G.spd, 1 - Math.exp(-dt * 3));
        e.vx = clamp(dx * 2.4, -110, 110);
      } else if (e.type === 'blade') {
        const side = dx >= 0 ? -28 : 28;
        const want = G.ship.x + side;
        e.vx = clamp((want - e.x) * 3.2, -130, 130);
        e.spd = lerp(e.spd, G.spd, 1 - Math.exp(-dt * 2.2));
        if (Math.abs(e.y - G.alt) < 36 && Math.abs(Math.abs(dx) - 28) < 14) {
          e.blade = Math.min(1, e.blade + dt * 4);
        } else e.blade = Math.max(0, e.blade - dt * 2);
        e.hw = HW.blade + e.blade * 7;
      } else if (e.type === 'dump') {
        e.spd = lerp(e.spd, G.spd * 0.9, dt * 2);
        e.vx = clamp(dx * 0.8, -50, 50);
        e.dropT -= dt;
        if (e.dropT <= 0 && e.y > G.alt + 80) {
          e.dropT = isNight() ? 1.1 : 1.5;
          if (!occupied(e.y - 24, e.x, 16)) {
            pushEnt({
              type: 'barrel', x: e.x, y: e.y - 22, spd: 0, vx: 0,
              alive: true, hw: HW.barrel, hh: HH.barrel, hp: 1,
              boat: e.boat, spin: 0, blind: 0, dropT: 0, blade: 0, rgb: ORG, lane: 0, phase: 0, used: false, ramp: 0
            });
          }
        }
      }
      keepOnRoad(e, e.y);
    }
  }

  function updateOils(dt) {
    for (let i = G.oils.length - 1; i >= 0; i--) {
      const o = G.oils[i];
      o.t += dt;
      o.life -= dt;
      if (o.life <= 0) G.oils.splice(i, 1);
    }
    for (let i = G.smokes.length - 1; i >= 0; i--) {
      const s = G.smokes[i];
      s.t += dt;
      s.life -= dt;
      s.r += dt * 16;
      s.x += Math.sin(s.t * 4) * 8 * dt;
      if (s.life <= 0) G.smokes.splice(i, 1);
    }
  }

  function updatePlayer(dt) {
    if (G.boardT > 0) {
      G.boardT -= dt;
      G.ship.vx *= Math.exp(-dt * 8);
      return;
    }
    const acc = 2600;
    const spd = turnSpd();
    if (keys.l || keys.r) {
      if (keys.l) G.ship.vx -= acc * dt;
      if (keys.r) G.ship.vx += acc * dt;
      G.ship.vx = clamp(G.ship.vx, -spd, spd);
      G.ship.x += G.ship.vx * dt;
    } else if ((pointer.down || pointer.hover) && inputSrc === 'ptr') {
      G.ship.x = lerp(G.ship.x, pointer.x, 1 - Math.exp(-dt * 14));
      G.ship.vx = 0;
    } else {
      G.ship.vx *= Math.exp(-dt * 9);
      G.ship.x += G.ship.vx * dt;
    }
    G.ship.x = clamp(G.ship.x, 8, VW - 8);

    const lo = minSpd();
    const hi = maxSpd();
    if (inputSrc === 'ptr' && (pointer.down || pointer.hover)) {
      const t = clamp((PLAYER_SY + 80 - pointer.y) / 280, 0, 1);
      G.spd = lerp(G.spd, lerp(lo, hi, t), 1 - Math.exp(-dt * 5.2));
    } else {
      if (keys.u) G.spd += 240 * dt;
      if (keys.d) G.spd -= 260 * dt;
      if (!keys.u && !keys.d) G.spd = lerp(G.spd, cruise(), 1 - Math.exp(-dt * 0.55));
    }
    G.spd = clamp(G.spd, lo, hi);
  }

  function checkWater() {
    const now = roadAt(G.alt).water;
    if (now !== G.waterWas && G.mode === 'play') {
      G.boat = now;
      if (now) {
        toast('登艇', false, true);
        audio.splash();
        emit(18, {
          x: G.ship.x, y: G.alt, j: 12,
          vx0: -120, vx1: 120, vy0: -40, vy1: 140,
          r0: 1.5, r1: 4, life: 0.4, rgb: CYN, g: 200
        });
        screenFlash(CYN, 0.35);
        hitStop(0.04);
      } else {
        toast('上岸', false, true);
        audio.splash();
        screenFlash(MINT, 0.28);
      }
    }
    G.waterWas = now;
    G.boat = now;
  }

  function checkCollide() {
    if (G.deadT > 0 || G.boardT > 0) return;
    const x = G.ship.x;
    const y = G.alt;
    const r = roadAt(y);
    const hw = HW.player;
    if (G.invuln > 0) {
      if (x - hw < r.L || x + hw > r.R) G.ship.x = lerp(G.ship.x, r.cx, 0.4);
      return;
    }
    if (x - hw + 2 < r.L || x + hw - 2 > r.R) {
      killPlayer(G.boat ? '翻艇了' : '冲出公路');
      return;
    }
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      if (e.type === 'van') {
        if (aabb(x, y, hw, HH.player, e.x, e.y, e.hw, e.hh)) {
          if (!e.used && e.y > y) restock(e);
          else G.ship.x += (x < e.x ? -1 : 1) * 8;
        }
        continue;
      }
      if (e.type === 'heli') continue;
      if (aabb(x, y, hw, HH.player, e.x, e.y, e.hw, e.hh)) {
        if (e.type === 'civ') {
          takeScore(200);
          floatText(e.x, e.y, '-200', MAG, false);
          destroy(e, true);
          killPlayer('撞到平民');
          return;
        }
        if (e.type === 'barrel') {
          e.alive = false;
          explode(e.x, e.y, ORG, 14);
          killPlayer('撞桶了');
          return;
        }
        if (e.type === 'bomb') {
          e.alive = false;
          explode(e.x, e.y, ORG, 18);
          killPlayer('被炸了');
          return;
        }
        if (e.type === 'blade' && e.blade > 0.4) {
          destroy(e, false);
          killPlayer('被划了');
          return;
        }
        destroy(e, false);
        killPlayer('被撞了');
        return;
      }
    }
  }

  function updateFx(dt) {
    if (G.muzzle > 0) G.muzzle = Math.max(0, G.muzzle - dt);
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 3.4);
    G.punch = lerp(G.punch, 1, 1 - Math.exp(-dt * 14));
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0 && toastEl) toastEl.classList.add('hidden');
    }
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy -= p.g * dt;
      p.vx *= 0.98;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.28) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.38) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += (f.vy || -70) * dt;
      if (f.t > f.life) floats.splice(i, 1);
    }
    for (let i = wakes.length - 1; i >= 0; i--) {
      wakes[i].t += dt;
      if (wakes[i].t > 0.4) wakes.splice(i, 1);
    }
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    if (G.invuln > 0 && G.mode === 'play') G.invuln = Math.max(0, G.invuln - dt);
    if (G.fireCd > 0) G.fireCd = Math.max(0, G.fireCd - dt);
    if (G.oilCd > 0) G.oilCd = Math.max(0, G.oilCd - dt);
    if (G.smokeCd > 0) G.smokeCd = Math.max(0, G.smokeCd - dt);
    if (G.missCd > 0) G.missCd = Math.max(0, G.missCd - dt);

    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.4);
      return;
    }

    if (G.mode === 'title') {
      G.alt += 110 * dt;
      const r = roadAt(G.alt);
      G.ship.x = lerp(G.ship.x, r.cx, 1 - Math.exp(-dt * 2.2));
      G.boat = r.water;
      ensureWorld();
      updateEnts(dt);
      updateOils(dt);
      updateFx(dt);
      G.fireHold = false;
      return;
    }

    if (G.mode === 'lose' || G.mode === 'win') {
      updateEnts(dt);
      updateFx(dt);
      return;
    }

    if (G.deadT > 0) {
      G.deadT -= dt;
      updateEnts(dt);
      updateFx(dt);
      if (G.deadT <= 0) {
        if (G.lives <= 0) loseRun();
        else respawn();
      }
      syncHud();
      return;
    }

    if (G.winT > 0) {
      G.winT -= dt;
      updateEnts(dt);
      updateFx(dt);
      if (G.winT <= 0) winRun();
      return;
    }

    updatePlayer(dt);
    const oldAlt = G.alt;
    G.alt += G.spd * dt;

    if (!REDUCE && ((G.clock * 36) | 0) !== ((G.clock - dt) * 36 | 0)) {
      wakes.push({
        x: G.ship.x,
        y: oldAlt - 10,
        t: 0,
        w: (G.boat ? 10 : 6) + G.spd * 0.018,
        boat: G.boat
      });
      capArr(wakes, 30);
    }

    checkWater();
    ensureWorld();
    updateEnts(dt);
    updateShots(dt);
    updateMissiles(dt);
    updateOils(dt);
    if (G.fireHold) fire();

    if (!isNight() && G.alt >= GOAL && G.winT === 0) {
      G.winT = 1.15;
      G.invuln = Math.max(G.invuln, 1.2);
      toast('任务完成', false, true);
      screenFlash(GOLD, 0.5);
      audio.win();
    }

    if (G.mode === 'play' && G.deadT <= 0 && G.winT === 0) checkCollide();

    G.distAcc += G.spd * dt;
    if (G.distAcc > 90) {
      G.distAcc -= 90;
      addScore(8);
    }

    updateFx(dt);
    syncHud();
  }

  function drawBg() {
    const night = isNight();
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(FIELD));
    if (night) {
      g.addColorStop(0, '#06140c');
      g.addColorStop(1, '#030906');
    } else {
      g.addColorStop(0, '#0a1c10');
      g.addColorStop(1, '#07140c');
    }
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, FIELD * scale);
  }

  function drawRoad() {
    const step = 4;
    const ptsL = [];
    const ptsR = [];
    const amts = [];
    for (let syy = -10; syy <= FIELD + 10; syy += step) {
      const wy = screenToWorldY(syy);
      const r = roadAt(wy);
      ptsL.push(r.L, syy);
      ptsR.push(r.R, syy);
      amts.push(r.amt);
    }

    ctx.beginPath();
    ctx.moveTo(sx(ptsL[0]), sy(ptsL[1]));
    for (let i = 2; i < ptsL.length; i += 2) ctx.lineTo(sx(ptsL[i]), sy(ptsL[i + 1]));
    for (let i = ptsR.length - 2; i >= 0; i -= 2) ctx.lineTo(sx(ptsR[i]), sy(ptsR[i + 1]));
    ctx.closePath();

    const night = isNight();
    const rg = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(FIELD));
    if (night) {
      rg.addColorStop(0, '#141c1a');
      rg.addColorStop(1, '#0c1210');
    } else {
      rg.addColorStop(0, '#222a28');
      rg.addColorStop(1, '#1a2220');
    }
    ctx.fillStyle = rg;
    ctx.fill();

    ctx.save();
    ctx.clip();

    for (let i = 0, k = 0; i < ptsL.length; i += 2, k++) {
      const amt = amts[k];
      if (amt < 0.08) continue;
      const syy = ptsL[i + 1];
      const L = ptsL[i];
      const R = ptsR[i];
      ctx.fillStyle = rgba(CYN, 0.18 * amt + (night ? 0.08 : 0.04));
      ctx.fillRect(sx(L), sy(syy), (R - L) * scale, step * scale + 0.6);
    }

    const y0 = screenToWorldY(-8);
    const y1 = screenToWorldY(FIELD + 8);
    const dash = 28;
    const i0 = Math.floor(y0 / dash);
    const i1 = Math.ceil(y1 / dash);
    for (let n = i0; n <= i1; n++) {
      const wy = n * dash;
      const r = roadAt(wy);
      if (r.amt > 0.55) continue;
      const syy = worldToScreenY(wy);
      const on = (n & 1) === 0;
      if (!on) continue;
      ctx.fillStyle = rgba(GOLD, night ? 0.38 : 0.55);
      const lw = (r.w / 3);
      ctx.fillRect(sx(r.L + lw - 1), sy(syy), 2.2 * scale, 13 * scale);
      ctx.fillRect(sx(r.R - lw - 1), sy(syy), 2.2 * scale, 13 * scale);
    }

    if (G.boat || waterAmt(G.alt) > 0.2) {
      ctx.globalAlpha = 0.22;
      for (let syy = 6; syy < FIELD; syy += 16) {
        const wy = screenToWorldY(syy);
        const r = roadAt(wy);
        if (r.amt < 0.2) continue;
        const shift = ((wy * 0.4 + G.t * 80) % 40) - 20;
        ctx.strokeStyle = rgba(CYN, 0.45 * r.amt);
        ctx.lineWidth = 1.2 * scale;
        ctx.beginPath();
        ctx.moveTo(sx(r.cx + shift - 16), sy(syy));
        ctx.lineTo(sx(r.cx + shift + 16), sy(syy));
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.6 * scale;
    ctx.strokeStyle = rgba(MINT, night ? 0.55 : 0.78);
    ctx.shadowColor = rgba(MINT, 0.4);
    ctx.shadowBlur = 8 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(ptsL[0]), sy(ptsL[1]));
    for (let i = 2; i < ptsL.length; i += 2) ctx.lineTo(sx(ptsL[i]), sy(ptsL[i + 1]));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx(ptsR[0]), sy(ptsR[1]));
    for (let i = 2; i < ptsR.length; i += 2) ctx.lineTo(sx(ptsR[i]), sy(ptsR[i + 1]));
    ctx.stroke();
    ctx.restore();

    const stepY = 24;
    const k0 = Math.floor(y0 / stepY);
    const k1 = Math.ceil(y1 / stepY);
    for (let k = k0; k <= k1; k++) {
      const wy = k * stepY;
      const r = roadAt(wy);
      const syy = worldToScreenY(wy);
      const hL = hash2(k * 3 + 2);
      const hR = hash2(k * 5 + 9);
      drawBush(r.L * (0.18 + hL * 0.55), syy, 5 + hL * 8, hL);
      drawBush(r.R + (VW - r.R) * (0.18 + hR * 0.55), syy, 5 + hR * 8, hR);
      if (night && (k % 4 === 0)) drawLamp(r.L - 10, syy, 1);
      if (night && (k % 4 === 2)) drawLamp(r.R + 10, syy, -1);
    }
  }

  function drawBush(x, syy, r, h) {
    if (syy < -16 || syy > FIELD + 16) return;
    ctx.fillStyle = rgba(LEAF, 0.5 + h * 0.32);
    ctx.beginPath();
    ctx.ellipse(sx(x), sy(syy), r * scale, r * 0.7 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(MINT, 0.22);
    ctx.beginPath();
    ctx.ellipse(sx(x - r * 0.2), sy(syy - r * 0.15), r * 0.4 * scale, r * 0.28 * scale, 0, 0, TAU);
    ctx.fill();
  }

  function drawLamp(x, syy, dir) {
    if (syy < -20 || syy > FIELD + 20) return;
    ctx.fillStyle = rgba(GOLD, 0.18);
    ctx.beginPath();
    ctx.ellipse(sx(x + dir * 4), sy(syy), 16 * scale, 10 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.85);
    ctx.fillRect(sx(x - 1.2), sy(syy - 10), 2.4 * scale, 14 * scale);
    ctx.beginPath();
    ctx.arc(sx(x), sy(syy - 11), 3.2 * scale, 0, TAU);
    ctx.fill();
    void dir;
  }

  function drawWakes() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < wakes.length; i++) {
      const w = wakes[i];
      const a = 1 - w.t / 0.4;
      const syy = worldToScreenY(w.y);
      ctx.strokeStyle = rgba(w.boat ? CYN : MINT, 0.2 * a);
      ctx.lineWidth = 1.2 * scale;
      ctx.beginPath();
      ctx.ellipse(sx(w.x), sy(syy), (w.w + w.t * 22) * scale, (3 + w.t * 6) * scale, 0, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawOils() {
    for (let i = 0; i < G.oils.length; i++) {
      const o = G.oils[i];
      const syy = worldToScreenY(o.y);
      if (syy < -30 || syy > FIELD + 30) continue;
      const a = clamp(o.life / 5.4, 0, 1);
      ctx.save();
      ctx.translate(sx(o.x), sy(syy));
      ctx.rotate(Math.sin(o.t * 0.8) * 0.08);
      ctx.fillStyle = rgba(OILC, 0.72 * a);
      ctx.beginPath();
      ctx.ellipse(0, 0, o.w * 0.55 * scale, 15 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(MAG, 0.45 * a);
      ctx.lineWidth = 1.4 * scale;
      ctx.stroke();
      ctx.strokeStyle = rgba(CYN, 0.28 * a);
      ctx.beginPath();
      ctx.ellipse(0, 0, o.w * 0.32 * scale, 7 * scale, 0.4, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawSmokes() {
    for (let i = 0; i < G.smokes.length; i++) {
      const s = G.smokes[i];
      const syy = worldToScreenY(s.y);
      if (syy < -40 || syy > FIELD + 40) continue;
      const a = clamp(s.life / 1.7, 0, 1);
      ctx.fillStyle = rgba(ASH, 0.22 * a);
      ctx.beginPath();
      ctx.ellipse(sx(s.x), sy(syy), s.r * scale, s.r * 0.72 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.08 * a);
      ctx.beginPath();
      ctx.ellipse(sx(s.x - s.r * 0.2), sy(syy - s.r * 0.15), s.r * 0.4 * scale, s.r * 0.3 * scale, 0, 0, TAU);
      ctx.fill();
    }
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

  function drawCar(x, syy, hw, hh, rgb, boat, spin, lights) {
    ctx.save();
    ctx.translate(sx(x), sy(syy));
    if (spin) ctx.rotate(spin);
    if (boat) {
      ctx.fillStyle = rgba(rgb, 0.96);
      ctx.beginPath();
      ctx.moveTo(0, -hh * scale);
      ctx.lineTo(hw * scale, -hh * 0.2 * scale);
      ctx.lineTo(hw * 0.72 * scale, hh * scale);
      ctx.lineTo(-hw * 0.72 * scale, hh * scale);
      ctx.lineTo(-hw * scale, -hh * 0.2 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(CYN, 0.8);
      roundRect(-hw * 0.45 * scale, -hh * 0.15 * scale, hw * 0.9 * scale, hh * 0.55 * scale, 2 * scale);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, lights ? 0.95 : 0.5);
      ctx.fillRect(-hw * 0.55 * scale, -hh * 0.92 * scale, 3.2 * scale, 3 * scale);
      ctx.fillRect(hw * 0.35 * scale, -hh * 0.92 * scale, 3.2 * scale, 3 * scale);
    } else {
      ctx.fillStyle = rgba([8, 10, 10], 0.9);
      ctx.fillRect((-hw - 2) * scale, (-hh + 4) * scale, 3 * scale, 6 * scale);
      ctx.fillRect((hw - 1) * scale, (-hh + 4) * scale, 3 * scale, 6 * scale);
      ctx.fillRect((-hw - 2) * scale, (hh - 10) * scale, 3 * scale, 6 * scale);
      ctx.fillRect((hw - 1) * scale, (hh - 10) * scale, 3 * scale, 6 * scale);
      ctx.fillStyle = rgba(rgb, 0.96);
      roundRect(-hw * scale, -hh * scale, hw * 2 * scale, hh * 2 * scale, 3.2 * scale);
      ctx.fill();
      ctx.fillStyle = rgba(CYN, 0.78);
      roundRect(-hw * 0.62 * scale, -hh * 0.72 * scale, hw * 1.24 * scale, hh * 0.7 * scale, 1.6 * scale);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.18);
      ctx.fillRect(-hw * 0.5 * scale, 2 * scale, hw * scale, 3 * scale);
      ctx.fillStyle = rgba(GOLD, lights ? 1 : 0.55);
      ctx.fillRect((-hw + 1.5) * scale, (-hh + 1) * scale, 3.4 * scale, 2.4 * scale);
      ctx.fillRect((hw - 4.8) * scale, (-hh + 1) * scale, 3.4 * scale, 2.4 * scale);
      ctx.fillStyle = rgba(MAG, 0.8);
      ctx.fillRect((-hw + 2) * scale, (hh - 3.2) * scale, 3 * scale, 2 * scale);
      ctx.fillRect((hw - 5) * scale, (hh - 3.2) * scale, 3 * scale, 2 * scale);
    }
    ctx.restore();
  }

  function drawVan(e, syy) {
    ctx.save();
    ctx.translate(sx(e.x), sy(syy));
    const hw = e.hw;
    const hh = e.hh;
    ctx.fillStyle = rgba(GOLD, 0.95);
    roundRect(-hw * scale, -hh * scale, hw * 2 * scale, hh * 2 * scale, 3 * scale);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.9);
    roundRect(-hw * 0.82 * scale, -hh * 0.55 * scale, hw * 1.64 * scale, hh * 1.05 * scale, 2 * scale);
    ctx.fill();
    ctx.fillStyle = rgba(CYN, 0.7);
    roundRect(-hw * 0.5 * scale, -hh * 0.92 * scale, hw * scale, 8 * scale, 1.4 * scale);
    ctx.fill();
    ctx.fillStyle = rgba(MINT, 0.9);
    ctx.font = '700 ' + (8 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VAN', 0, 4 * scale);
    if (e.ramp > 0) {
      ctx.fillStyle = rgba(ASH, 0.7 * e.ramp);
      ctx.beginPath();
      ctx.moveTo(-hw * 0.55 * scale, hh * scale);
      ctx.lineTo(hw * 0.55 * scale, hh * scale);
      ctx.lineTo(hw * 0.85 * scale, (hh + 16 * e.ramp) * scale);
      ctx.lineTo(-hw * 0.85 * scale, (hh + 16 * e.ramp) * scale);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawHeli(e, syy) {
    ctx.save();
    ctx.translate(sx(e.x), sy(syy));
    const spin = Math.cos(G.rotor * 16);
    ctx.strokeStyle = rgba(GOLD, 0.92);
    ctx.lineWidth = 1.7 * scale;
    ctx.beginPath();
    ctx.moveTo(-18 * scale * spin, -9 * scale);
    ctx.lineTo(18 * scale * spin, -9 * scale);
    ctx.stroke();
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, 0, 13 * scale, 7 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.75);
    ctx.beginPath();
    ctx.ellipse(2 * scale, -1 * scale, 5.5 * scale, 3.2 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(MAG, 0.85);
    ctx.fillRect(8 * scale, -1.5 * scale, 11 * scale, 3 * scale);
    ctx.restore();
  }

  function drawBarrel(e, syy) {
    ctx.save();
    ctx.translate(sx(e.x), sy(syy));
    ctx.fillStyle = rgba(e.type === 'bomb' ? RED : ORG, 0.95);
    roundRect(-e.hw * scale, -e.hh * scale, e.hw * 2 * scale, e.hh * 2 * scale, 3 * scale);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.7);
    ctx.fillRect(-e.hw * 0.7 * scale, -2 * scale, e.hw * 1.4 * scale, 3 * scale);
    if (e.type === 'bomb') {
      ctx.strokeStyle = rgba(WHT, 0.7);
      ctx.lineWidth = 1.2 * scale;
      ctx.beginPath();
      ctx.moveTo(0, -e.hh * scale);
      ctx.lineTo(3 * scale, (-e.hh - 5) * scale);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawEnt(e) {
    const syy = worldToScreenY(e.y);
    if (syy < -50 || syy > FIELD + 50) return;
    if (!e.alive) return;
    if (e.type === 'van') {
      drawVan(e, syy);
      return;
    }
    if (e.type === 'heli') {
      drawHeli(e, syy);
      return;
    }
    if (e.type === 'barrel' || e.type === 'bomb') {
      drawBarrel(e, syy);
      return;
    }
    const spin = e.spin > 0 ? e.phase : 0;
    drawCar(e.x, syy, e.hw, e.hh, e.rgb || MAG, e.boat, spin, isNight() || e.type !== 'civ');
    if (e.type === 'blade' && e.blade > 0.05) {
      ctx.save();
      ctx.translate(sx(e.x), sy(syy));
      ctx.fillStyle = rgba(PNK, 0.9);
      const w = 6 + e.blade * 10;
      ctx.fillRect((-e.hw - w) * scale, -2 * scale, w * scale, 4 * scale);
      ctx.fillRect(e.hw * scale, -2 * scale, w * scale, 4 * scale);
      ctx.restore();
    }
  }

  function drawShots() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      const syy = worldToScreenY(s.y);
      if (s.trail) {
        for (let t = 0; t < s.trail.length; t++) {
          const p = s.trail[t];
          const a = (t + 1) / s.trail.length;
          ctx.fillStyle = rgba(CYN, 0.2 * a);
          ctx.fillRect(sx(p.x - 1), sy(worldToScreenY(p.y)), 2 * scale, 8 * scale);
        }
      }
      ctx.fillStyle = rgba(WHT, 0.95);
      ctx.fillRect(sx(s.x - 1.4), sy(syy - 7), 2.8 * scale, 12 * scale);
      ctx.fillStyle = rgba(CYN, 0.9);
      ctx.fillRect(sx(s.x - 1), sy(syy - 9), 2 * scale, 6 * scale);
    }
    for (let i = 0; i < G.miss.length; i++) {
      const m = G.miss[i];
      if (m.trail) {
        for (let t = 0; t < m.trail.length; t++) {
          const p = m.trail[t];
          const a = (t + 1) / m.trail.length;
          ctx.fillStyle = rgba(MAG, 0.28 * a);
          ctx.beginPath();
          ctx.arc(sx(p.x), sy(worldToScreenY(p.y)), (2 + a * 2) * scale, 0, TAU);
          ctx.fill();
        }
      }
      const syy = worldToScreenY(m.y);
      ctx.fillStyle = rgba(GOLD, 1);
      ctx.beginPath();
      ctx.moveTo(sx(m.x), sy(syy - 8));
      ctx.lineTo(sx(m.x + 4), sy(syy + 6));
      ctx.lineTo(sx(m.x - 4), sy(syy + 6));
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(MAG, 0.9);
      ctx.fillRect(sx(m.x - 1.6), sy(syy + 4), 3.2 * scale, 6 * scale);
    }
    ctx.restore();
  }

  function drawPlayer() {
    if (G.deadT > 0 || G.boardT > 0.15) return;
    if (G.invuln > 0 && ((G.clock * 14) | 0) % 2 === 0 && G.mode === 'play') return;
    const x = G.ship.x;
    const syy = PLAYER_SY;
    if (G.muzzle > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(CYN, G.muzzle * 8);
      ctx.beginPath();
      ctx.ellipse(sx(x - 5), sy(syy - 16), 5 * scale, 8 * scale, 0, 0, TAU);
      ctx.ellipse(sx(x + 5), sy(syy - 16), 5 * scale, 8 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    drawCar(x, syy, HW.player, HH.player, MINT, G.boat, G.ship.vx * 0.0012, true);
    if (isNight() || G.boat) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(GOLD, 0.12);
      ctx.beginPath();
      ctx.moveTo(sx(x - 6), sy(syy - 14));
      ctx.lineTo(sx(x - 28), sy(syy - 90));
      ctx.lineTo(sx(x + 28), sy(syy - 90));
      ctx.lineTo(sx(x + 6), sy(syy - 14));
      ctx.fill();
      ctx.restore();
    }
  }

  function drawFx() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / (p.max || 0.4), 0, 1);
      const syy = worldToScreenY(p.y);
      ctx.fillStyle = rgba(p.rgb, 0.85 * a);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(syy), p.r * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const a = 1 - s.t / 0.28;
      const syy = worldToScreenY(s.y);
      ctx.strokeStyle = rgba(s.rgb, 0.8 * a);
      ctx.lineWidth = 1.6 * scale;
      const rad = s.rad * (0.4 + s.t * 3);
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(syy), rad * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
    for (let i = 0; i < rings.length; i++) {
      const s = rings[i];
      const a = 1 - s.t / 0.38;
      const syy = worldToScreenY(s.y);
      ctx.strokeStyle = rgba(s.rgb, 0.45 * a);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(syy), (s.r + s.t * 70) * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      const syy = worldToScreenY(f.y);
      ctx.font = '700 ' + (f.size * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillStyle = rgba(f.rgb, 0.95 * a);
      ctx.fillText(f.text, sx(f.x), sy(syy));
    }
  }

  function drawHudStrip() {
    ctx.fillStyle = 'rgba(4, 12, 8, 0.82)';
    ctx.fillRect(sx(0), sy(FIELD), VW * scale, (VH - FIELD) * scale);
    ctx.fillStyle = rgba(MINT, 0.18);
    ctx.fillRect(sx(0), sy(FIELD), VW * scale, 1.2 * scale);

    const spdT = (G.spd - minSpd()) / Math.max(1, maxSpd() - minSpd());
    const bx = 24;
    const by = FIELD + 16;
    const bw = 120;
    ctx.fillStyle = rgba(WHT, 0.12);
    roundRect(sx(bx), sy(by), bw * scale, 8 * scale, 4 * scale);
    ctx.fill();
    ctx.fillStyle = rgba(spdT > 0.8 ? GOLD : CYN, 0.9);
    roundRect(sx(bx), sy(by), bw * spdT * scale, 8 * scale, 4 * scale);
    ctx.fill();
    ctx.font = '600 ' + (9 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = rgba(HOT, 0.85);
    ctx.fillText('SPD ' + String(Math.round(G.spd)), sx(bx), sy(by + 22));

    const items = [
      { lab: 'OIL', n: G.oil, rgb: ORG },
      { lab: 'SMK', n: G.smokeN, rgb: ASH },
      { lab: 'MSL', n: G.missiles, rgb: MAG }
    ];
    ctx.textAlign = 'center';
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const x = 200 + i * 78;
      ctx.fillStyle = rgba(it.rgb, 0.18);
      roundRect(sx(x), sy(FIELD + 8), 68 * scale, 30 * scale, 8 * scale);
      ctx.fill();
      ctx.fillStyle = rgba(it.n <= 0 ? MAG : WHT, 0.9);
      ctx.font = '700 ' + (11 * scale) + 'px "Segoe UI", sans-serif';
      ctx.fillText(it.lab + ' ' + it.n, sx(x + 34), sy(FIELD + 26));
    }
  }

  function drawSpeedLines() {
    const t = (G.spd - minSpd()) / Math.max(1, maxSpd() - minSpd());
    if (t < 0.5 || REDUCE) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const n = 8 + (t * 10) | 0;
    for (let i = 0; i < n; i++) {
      const seed = hash2(i * 19 + ((G.alt / 36) | 0));
      const x = 16 + seed * (VW - 32);
      const y = ((seed * 900 + G.t * (200 + t * 480)) % FIELD);
      ctx.strokeStyle = rgba(MINT, 0.07 + t * 0.12);
      ctx.lineWidth = 1.2 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(x), sy(y));
      ctx.lineTo(sx(x), sy(y + 10 + t * 20));
      ctx.stroke();
    }
    ctx.restore();
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#020805';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    if (G.shake > 0 && !REDUCE) {
      ctx.translate((Math.random() - 0.5) * G.shake * 1.4, (Math.random() - 0.5) * G.shake * 1.2);
    }
    if (G.punch !== 1 && !REDUCE) {
      const cx = sx(VW * 0.5);
      const cy = sy(PLAYER_SY);
      ctx.translate(cx, cy);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-cx, -cy);
    }

    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();

    drawBg();
    drawRoad();
    drawWakes();
    drawOils();
    drawSmokes();
    drawSpeedLines();
    const list = G.ents.slice().sort(function (a, b) { return b.y - a.y; });
    for (let i = 0; i < list.length; i++) {
      if (list[i].type !== 'heli') drawEnt(list[i]);
    }
    drawShots();
    drawPlayer();
    for (let i = 0; i < list.length; i++) {
      if (list[i].type === 'heli') drawEnt(list[i]);
    }
    drawFx();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();
    drawHudStrip();
    ctx.restore();

    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.45);
      ctx.fillRect(sx(0), sy(0), VW * scale, FIELD * scale);
    }
  }

  function resize() {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    canvas.width = (W * dpr) | 0;
    canvas.height = (H * dpr) | 0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const fit = Math.min(W / VW, H / VH);
    scale = fit;
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
  }

  function pointerWorldX(e) {
    const rect = canvas.getBoundingClientRect();
    return (e.clientX - rect.left - ox) / scale;
  }
  function pointerWorldY(e) {
    const rect = canvas.getBoundingClientRect();
    return (e.clientY - rect.top - oy) / scale;
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('road');
    else startGame(G.kind || 'road');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('road');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function onKey(e, down) {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'Left' || k === 'a' || k === 'A') {
      keys.l = down;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowRight' || k === 'Right' || k === 'd' || k === 'D') {
      keys.r = down;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowUp' || k === 'Up') {
      keys.u = down;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowDown' || k === 'Down' || k === 's' || k === 'S') {
      keys.d = down;
      if (down) inputSrc = 'key';
    }
    const space = k === ' ' || k === 'Spacebar' || e.code === 'Space';
    if (down && (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown' || space || k === 'Enter' || k === 'q' || k === 'Q' || k === 'w' || k === 'W' || k === 'e' || k === 'E')) {
      e.preventDefault();
    }
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
    if (k === 'q' || k === 'Q') {
      audio.ensure();
      dropOil();
      return;
    }
    if (k === 'w' || k === 'W') {
      audio.ensure();
      dropSmoke();
      return;
    }
    if (k === 'e' || k === 'E') {
      audio.ensure();
      fireMissile();
      return;
    }
    if (k === '2') {
      audio.ensure();
      if (G.mode === 'title' || G.mode === 'win') startGame('night');
      return;
    }
    if (k === '1') {
      audio.ensure();
      if (G.mode === 'title') startGame('road');
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      if (G.mode === 'play') {
        G.fireHold = true;
        fire();
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
      pointer.x = clamp(pointerWorldX(e), 10, VW - 10);
      pointer.y = pointerWorldY(e);
      inputSrc = 'ptr';
      G.fireHold = true;
      if (G.mode === 'play') fire();
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      pointer.x = clamp(pointerWorldX(e), 10, VW - 10);
      pointer.y = pointerWorldY(e);
      if (!pointer.down && e.pointerType === 'mouse') pointer.hover = true;
      if (pointer.down || e.pointerType === 'mouse') inputSrc = 'ptr';
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
      if (!pointer.down) G.fireHold = false;
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

  if (btnRoad) {
    btnRoad.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
      else startGame('road');
    });
  }
  if (btnNight) {
    btnNight.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose') goTitle();
      else startGame('night');
    });
  }
  if (btnRetry) btnRetry.addEventListener('click', restart);
  if (btnMute) {
    btnMute.addEventListener('click', function () {
      audio.ensure();
      audio.setMuted(!audio.muted);
    });
  }
  if (btnOil) btnOil.addEventListener('click', function () { audio.ensure(); dropOil(); });
  if (btnSmoke) btnSmoke.addEventListener('click', function () { audio.ensure(); dropSmoke(); });
  if (btnMissile) btnMissile.addEventListener('click', function () { audio.ensure(); fireMissile(); });

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
      G.fireHold = false;
    }
  });

  requestAnimationFrame(frame);
})();
