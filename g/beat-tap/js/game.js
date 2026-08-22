'use strict';

(function () {
  const VW = 420;
  const VH = 720;
  const LANES = 4;
  const COUNT = 4;
  const TRAVEL = 3.5;
  const TOP_Y = 58;
  const HIT_Y = 546;
  const REC_Y = 586;
  const BOT_Y = 708;
  const TOP_W = 0.34;
  const BOT_W = 0.92;
  const HP_MAX = 100;
  const WIN_P = 0.04;
  const WIN_G = 0.08;
  const WIN_O = 0.13;
  const WIN_M = 0.16;
  const STEP = 1 / 60;
  const BEST_KEY = 'playbox-beat-tap-best';
  const MUTE_KEY = 'playbox-beat-tap-mute';
  const AUTO_SPEED_KEY = 'playbox-beat-tap-auto-speed';
  const AUTO_SPEED_NAME = ['', '慢', '中', '快', '极快'];
  const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const OPS_TITLE = 'D F J K 拍道 · 点按音轨 · A 自动 · 完美回血 · 空血失败';
  const OPS_PLAY = 'D F J K 或点按音轨 · A 自动 · R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 90, 160];
  const VIO = [180, 120, 255];
  const WHITE = [255, 255, 255];
  const PEACH = [255, 176, 96];

  const LANE = [
    { key: 'D', code: 'KeyD', ch: 'd', rgb: MAG, pitch: 523.25 },
    { key: 'F', code: 'KeyF', ch: 'f', rgb: PEACH, pitch: 659.25 },
    { key: 'J', code: 'KeyJ', ch: 'j', rgb: CYN, pitch: 783.99 },
    { key: 'K', code: 'KeyK', ch: 'k', rgb: VIO, pitch: 987.77 }
  ];

  const BASS = [110, 130.81, 164.81, 146.83];

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
  const btnSong = document.getElementById('btn-song');
  const btnAccel = document.getElementById('btn-accel');
  const btnAgain = document.getElementById('btn-again');
  const btnMenu = document.getElementById('btn-menu');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnAuto = document.getElementById('btn-auto');
  const speedEl = document.getElementById('speed');
  const speedLab = document.getElementById('speed-lab');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const comboEl = document.getElementById('combo');
  const comboBox = document.getElementById('combo-box');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const bpmLabel = document.getElementById('bpm-label');
  const hpEl = document.getElementById('hp');
  const hpFill = document.getElementById('hp-fill');
  const progFill = document.getElementById('prog-fill');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const padEl = document.getElementById('pad');
  const padBtns = padEl ? padEl.querySelectorAll('button') : [];

  let W = 1;
  let H = 1;
  let dpr = 1;
  let scale = 1;
  let ox = 0;
  let oy = 0;
  let addTok = 0;
  let toastTok = 0;
  let kickTok = 0;
  let hpTok = 0;

  const notes = [];
  const particles = [];
  const rings = [];
  const floats = [];
  const motes = [];
  const trails = [];
  const holdN = [0, 0, 0, 0];
  const held = [false, false, false, false];
  const recPulse = [0, 0, 0, 0];
  const autoHoldT = [0, 0, 0, 0];
  const ptrLane = {};
  let autoOn = false;
  let autoSpeed = 3;

  const G = {
    mode: 'title',
    kind: 'one',
    seed: 1,
    startBpm: 128,
    endBpm: 128,
    accel: false,
    totalBeats: 160,
    playBeats: 156,
    endTime: 70,
    t0: 0,
    p0: 0,
    clock: 0,
    hp: HP_MAX,
    score: 0,
    bestO: 0,
    bestA: 0,
    combo: 0,
    maxCombo: 0,
    mult: 1,
    p: 0,
    g: 0,
    o: 0,
    m: 0,
    total: 0,
    judged: 0,
    stop: 0,
    freezeT: 0,
    shake: 0,
    kickX: 0,
    kickY: 0,
    flash: 0,
    flashRgb: MAG,
    punch: 1,
    beatPulse: 0,
    judge: '',
    judgeCol: GOLD,
    judgeT: 0,
    judgeLate: 0,
    toastT: 0,
    schedBeat: 0,
    lastBpmShown: 0,
    why: '',
    demoT: 0,
    playBeat: -1,
    demoBeat: -1
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
  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function mix(a, b, t) {
    return [
      (a[0] + (b[0] - a[0]) * t + 0.5) | 0,
      (a[1] + (b[1] - a[1]) * t + 0.5) | 0,
      (a[2] + (b[2] - a[2]) * t + 0.5) | 0
    ];
  }
  function ease(t) {
    return t * t * (3 - 2 * t);
  }

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function widthAt(p) {
    return lerp(TOP_W, BOT_W, clamp(p, 0, 1));
  }
  function yAt(p) {
    const t = p < 0 ? p : Math.pow(Math.max(0, p), 1.12);
    return lerp(TOP_Y, HIT_Y, t);
  }
  function laneLeft(p) {
    const w = widthAt(p) * VW;
    return VW * 0.5 - w * 0.5;
  }
  function laneW(p) {
    return widthAt(p) * VW / LANES;
  }
  function laneCX(lane, p) {
    return laneLeft(p) + (lane + 0.5) * laneW(p);
  }

  function bpmAtBeat(b) {
    if (!G.accel || Math.abs(G.endBpm - G.startBpm) < 0.05) return G.startBpm;
    const u = clamp(b / G.totalBeats, 0, 1);
    return G.startBpm + (G.endBpm - G.startBpm) * u;
  }
  function beatToTime(b) {
    const s = G.startBpm;
    const e = G.endBpm;
    const B = G.totalBeats;
    if (!G.accel || Math.abs(e - s) < 0.05) return b * 60 / s;
    const k = (e - s) / B;
    return (60 / k) * Math.log((s + k * b) / s);
  }
  function timeToBeat(t) {
    const s = G.startBpm;
    const e = G.endBpm;
    const B = G.totalBeats;
    if (!G.accel || Math.abs(e - s) < 0.05) return t * s / 60;
    const k = (e - s) / B;
    return (s / k) * (Math.exp(k * t / 60) - 1);
  }

  function songTime() {
    if (audio.ctx && G.t0 != null) return audio.ctx.currentTime - G.t0;
    return performance.now() / 1000 - G.p0;
  }
  function visTime() {
    if (G.stop > 0) return G.freezeT;
    return songTime();
  }

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    noiseBuf: null,
    ensure() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
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
      btnMute.textContent = m ? '静' : '声';
      btnMute.classList.toggle('muted', m);
      btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      try {
        localStorage.setItem(MUTE_KEY, m ? '1' : '0');
      } catch (err) { /* ignore */ }
    },
    beep(freq, dur, type, vol, slide, when) {
      if (!this.ctx || this.muted) return;
      const t = when != null ? when : this.ctx.currentTime;
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
    noise(dur, vol, freq, type, when) {
      if (!this.ctx || this.muted) return;
      if (!this.noiseBuf) {
        const sr = this.ctx.sampleRate;
        const buf = this.ctx.createBuffer(1, (sr * 0.28) | 0, sr);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        this.noiseBuf = buf;
      }
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      const f = this.ctx.createBiquadFilter();
      f.type = type || 'bandpass';
      f.frequency.value = freq || 900;
      f.Q.value = type === 'lowpass' ? 0.7 : 1.15;
      const g = this.ctx.createGain();
      const t = when != null ? when : this.ctx.currentTime;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
      src.stop(t + dur + 0.02);
    },
    kick(when) {
      this.beep(148, 0.11, 'sine', 0.18, 44, when);
      this.beep(64, 0.16, 'sine', 0.14, 28, when);
      this.noise(0.04, 0.05, 180, 'lowpass', when);
    },
    snare(when) {
      this.noise(0.08, 0.09, 1800, 'bandpass', when);
      this.noise(0.05, 0.05, 4200, 'highpass', when);
      this.beep(188, 0.07, 'triangle', 0.04, 90, when);
    },
    hat(when, vol) {
      this.noise(0.028, 0.035 * (vol || 1), 9000, 'highpass', when);
    },
    bass(when, freq) {
      this.beep(freq, 0.22, 'sine', 0.07, freq * 0.7, when);
      this.beep(freq * 2, 0.12, 'triangle', 0.025, freq, when);
    },
    click(when, strong) {
      this.beep(strong ? 1320 : 980, 0.04, 'square', strong ? 0.05 : 0.03, 420, when);
      this.noise(0.02, strong ? 0.04 : 0.02, 2400, 'bandpass', when);
    },
    hit(lane, grade) {
      this.ensure();
      const p = LANE[lane].pitch;
      if (grade === 'p') {
        this.noise(0.03, 0.07, 3200, 'highpass');
        this.beep(p, 0.09, 'triangle', 0.09, p * 1.6);
        this.beep(p * 2, 0.06, 'sine', 0.05, p * 2.4);
        this.beep(p * 3, 0.04, 'sine', 0.025);
      } else if (grade === 'g') {
        this.noise(0.025, 0.05, 2400, 'highpass');
        this.beep(p, 0.08, 'triangle', 0.07, p * 1.35);
        this.beep(p * 2, 0.05, 'sine', 0.03);
      } else if (grade === 'o') {
        this.beep(p * 0.75, 0.07, 'sine', 0.05, p * 0.5);
      } else {
        this.noise(0.12, 0.08, 280, 'lowpass');
        this.beep(180, 0.16, 'sawtooth', 0.05, 70);
        this.beep(92, 0.2, 'sine', 0.06, 40);
      }
    },
    empty() {
      this.ensure();
      this.beep(240, 0.04, 'square', 0.02, 120);
    },
    combo(n) {
      this.ensure();
      const f = 520 + Math.min(12, n) * 36;
      this.beep(f, 0.09, 'sine', 0.05, f * 1.5);
      this.beep(f * 1.25, 0.12, 'triangle', 0.04);
    },
    start() {
      this.ensure();
      this.beep(392, 0.08, 'sine', 0.05, 784);
      this.beep(784, 0.14, 'triangle', 0.04, 1175);
      this.noise(0.06, 0.04, 1800, 'highpass');
    },
    win() {
      this.ensure();
      this.beep(523, 0.12, 'sine', 0.06);
      this.beep(659, 0.14, 'sine', 0.055);
      this.beep(784, 0.16, 'triangle', 0.05);
      this.beep(1046, 0.28, 'sine', 0.05, 1568);
    },
    over() {
      this.ensure();
      this.beep(196, 0.2, 'sawtooth', 0.05, 80);
      this.beep(130, 0.32, 'sine', 0.07, 46);
      this.noise(0.18, 0.06, 220, 'lowpass');
    }
  };

  function currentBest() {
    return G.kind === 'accel' ? G.bestA : G.bestO;
  }

  function loadBest() {
    try {
      const raw = localStorage.getItem(BEST_KEY);
      if (!raw) {
        G.bestO = 0;
        G.bestA = 0;
      } else if (raw.charAt(0) === '{') {
        const j = JSON.parse(raw);
        G.bestO = j && isFinite(j.o) ? j.o | 0 : 0;
        G.bestA = j && isFinite(j.a) ? j.a | 0 : 0;
      } else {
        const n = parseInt(raw, 10);
        G.bestO = isFinite(n) && n > 0 ? n : 0;
        G.bestA = 0;
      }
    } catch (err) {
      G.bestO = 0;
      G.bestA = 0;
    }
    bestEl.textContent = String(currentBest());
  }

  function saveBest() {
    const key = G.kind === 'accel' ? 'bestA' : 'bestO';
    if (G.score <= G[key]) return;
    G[key] = G.score;
    bestEl.textContent = String(G[key]);
    try {
      localStorage.setItem(BEST_KEY, JSON.stringify({ o: G.bestO, a: G.bestA }));
    } catch (err) { /* ignore */ }
  }

  function addScore(n) {
    if (G.mode !== 'play' || n <= 0) return;
    G.score += n;
    scoreEl.textContent = String(G.score);
    saveBest();
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

  function setComboHud() {
    comboEl.textContent = String(G.combo);
    if (G.combo >= 2) {
      comboBox.classList.remove('hot');
      void comboBox.offsetWidth;
      comboBox.classList.add('hot');
    }
  }

  function setHpHud() {
    const u = clamp(G.hp / HP_MAX, 0, 1);
    hpFill.style.transform = 'scaleX(' + u + ')';
    hpEl.classList.toggle('low', G.hp <= 30);
  }

  function toast(msg, warn, gold) {
    toastTok += 1;
    const tok = toastTok;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold && !warn);
    toastEl.classList.remove('hidden');
    G.toastT = 0.9;
    setTimeout(function () {
      if (tok === toastTok) toastEl.classList.add('hidden');
    }, 860);
  }

  function hudPlay() {
    scoreEl.textContent = String(G.score);
    bestEl.textContent = String(currentBest());
    setComboHud();
    setHpHud();
    const t = G.mode === 'play' ? visTime() : 0;
    const bpm = Math.round(bpmAtBeat(Math.max(0, timeToBeat(t))));
    bpmLabel.textContent = bpm + ' BPM';
    bpmLabel.classList.toggle('hot', G.accel && bpm >= G.startBpm + 16);
    if (G.kind === 'accel') {
      stageLabel.textContent = '加速';
      stageLabel.classList.toggle('hot', bpm >= G.startBpm + 20);
      tagLabel.textContent = 'RUSH';
    } else {
      stageLabel.textContent = '一曲';
      stageLabel.classList.remove('hot');
      tagLabel.textContent = 'BEAT';
    }
    tagLabel.className = G.hp <= 30 && G.mode === 'play' ? 'warn' : (G.combo >= 50 ? 'hot' : '');
    if (G.hp <= 30 && G.mode === 'play') {
      hintEl.textContent = autoOn ? '托管中 · 血量见底即失败' : '血量见底即失败 · 抓完美回血';
      hintEl.className = 'hint warn';
    } else if (autoOn && G.mode === 'play') {
      hintEl.textContent = '托管中 · A 停下';
      hintEl.className = 'hint hot';
    } else {
      hintEl.textContent = OPS_PLAY;
      hintEl.className = 'hint';
    }
    const u = G.mode === 'play' ? clamp(t / G.endTime, 0, 1) : 0;
    progFill.style.width = (u * 100).toFixed(2) + '%';
  }

  function capArr(arr, n) {
    if (arr.length > n) arr.splice(0, arr.length - n);
  }

  function hitStop(sec) {
    if (REDUCE) return;
    G.freezeT = songTime();
    G.stop = Math.max(G.stop, sec);
  }

  function kick(nx, ny, mag) {
    if (REDUCE) return;
    G.kickX += nx * mag;
    G.kickY += ny * mag;
    G.shake = Math.max(G.shake, mag * 0.55);
    G.punch = Math.max(G.punch, 1 + Math.min(0.05, mag * 0.0035));
    kickTok += 1;
    stageEl.classList.remove('cut');
    void stageEl.offsetWidth;
    stageEl.classList.add('cut');
  }

  function screenFlash(rgb, a) {
    G.flash = Math.max(G.flash, a || 0.45);
    G.flashRgb = rgb;
  }

  function spark(x, y, rgb, n, spd) {
    const count = REDUCE ? Math.min(n, 6) : n;
    for (let i = 0; i < count; i++) {
      const a = rand(0, Math.PI * 2);
      const v = rand(spd * 0.35, spd);
      particles.push({
        x: x, y: y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - rand(40, 160),
        life: rand(0.22, 0.5),
        max: 0.5,
        rgb: rgb,
        r: rand(1.6, 3.8),
        g: rand(0.4, 1)
      });
    }
    capArr(particles, 220);
  }

  function ringAt(x, y, rgb, r) {
    rings.push({ x: x, y: y, rgb: rgb, r: r || 8, life: 0.32, max: 0.32 });
    capArr(rings, 28);
  }

  function floatText(x, y, text, rgb, size, big) {
    floats.push({
      x: x, y: y, text: text, rgb: rgb,
      size: size || 18, life: big ? 0.7 : 0.5, max: big ? 0.7 : 0.5,
      vy: big ? -70 : -52
    });
    capArr(floats, 24);
  }

  function burst(lane, grade) {
    const p = 1;
    const x = laneCX(lane, p);
    const y = HIT_Y;
    const rgb = LANE[lane].rgb;
    if (grade === 'p') {
      spark(x, y, mix(rgb, WHITE, 0.45), REDUCE ? 8 : 22, 340);
      spark(x, y, GOLD, REDUCE ? 4 : 10, 260);
      ringAt(x, y, GOLD, 10);
      ringAt(x, y, rgb, 16);
      screenFlash(mix(rgb, WHITE, 0.35), 0.28);
    } else if (grade === 'g') {
      spark(x, y, mix(rgb, WHITE, 0.2), REDUCE ? 6 : 14, 280);
      ringAt(x, y, rgb, 10);
      screenFlash(rgb, 0.18);
    } else if (grade === 'o') {
      spark(x, y, rgb, 6, 180);
    } else {
      spark(x, y, mix(MAG, [40, 10, 20], 0.2), 10, 160);
      screenFlash(MAG, 0.32);
    }
  }

  function densityAt(u, accel) {
    if (u < 0.1) return 0.22;
    if (u < 0.28) return 0.4 + u * 0.5;
    if (u < 0.46) return 0.62;
    if (u < 0.58) return accel ? 0.82 : 0.78;
    if (u < 0.66) return 0.3;
    if (u < 0.88) return accel ? 0.86 : 0.8;
    return 0.48;
  }

  function buildChart(seed, accel) {
    const rng = mulberry32(seed);
    const startBpm = 120 + (rng() * 21 | 0);
    const endBpm = accel ? startBpm + 30 + (rng() * 15 | 0) : startBpm;
    const seconds = 64 + (rng() * 23 | 0);
    const avg = (startBpm + endBpm) * 0.5;
    let playBeats = Math.round(seconds * avg / 60);
    playBeats = Math.round(playBeats / 4) * 4;
    playBeats = clamp(playBeats, 128, 192);
    const bars = playBeats / 4;
    const list = [];
    let lastLane = 1;
    let lastBeat = -8;

    for (let bar = 0; bar < bars; bar++) {
      const u = bar / bars;
      const dens = densityAt(u, accel);
      const use16 = u > 0.32 && rng() < (accel ? 0.55 : 0.42);
      const grid = bar < 2 ? 1 : use16 ? 0.25 : 0.5;
      const stream = bar >= 8 && u < 0.9 && rng() < (u > 0.66 ? 0.34 : 0.22);
      const jack = u > 0.5 && rng() < 0.07;
      for (let s = 0; s < 4; s += grid) {
        const beat = COUNT + bar * 4 + s;
        const onStream = stream && s < 3.2;
        if (bar < 2) {
          list.push({ beat: beat, lane: (bar * 2 + (s | 0) + (rng() * 2 | 0)) % 4 });
          lastLane = list[list.length - 1].lane;
          lastBeat = beat;
          continue;
        }
        if (!onStream && rng() > dens) continue;
        if (!onStream && !jack && beat - lastBeat < grid * 0.9 && rng() < 0.45) continue;
        let lane;
        if (onStream) {
          const dir = rng() < 0.5 ? -1 : 1;
          lane = clamp(lastLane + dir, 0, 3);
          if (lane === lastLane) lane = (lastLane + 1) % 4;
        } else if (jack && rng() < 0.7) {
          lane = lastLane;
        } else {
          lane = (lastLane + 1 + (rng() * 3 | 0)) % 4;
        }
        list.push({ beat: beat, lane: lane });
        if (dens > 0.5 && grid >= 0.5 && rng() < (accel ? 0.22 : 0.16)) {
          const other = lane < 2 ? 2 + (rng() * 2 | 0) : (rng() * 2 | 0);
          list.push({ beat: beat, lane: other });
        }
        lastLane = lane;
        lastBeat = beat;
      }
    }

    const fin = COUNT + playBeats - 1;
    list.push({ beat: fin, lane: 0 });
    list.push({ beat: fin, lane: 3 });
    if (rng() < 0.7) {
      list.push({ beat: fin, lane: 1 });
      list.push({ beat: fin, lane: 2 });
    }

    list.sort(function (a, b) {
      return a.beat - b.beat || a.lane - b.lane;
    });
    const out = [];
    const seen = {};
    for (let i = 0; i < list.length; i++) {
      const n = list[i];
      const k = n.beat.toFixed(3) + ':' + n.lane;
      if (seen[k]) continue;
      seen[k] = 1;
      out.push(n);
    }
    return {
      startBpm: startBpm,
      endBpm: endBpm,
      playBeats: playBeats,
      notes: out
    };
  }

  function applyChart(ch) {
    notes.length = 0;
    G.startBpm = ch.startBpm;
    G.endBpm = ch.endBpm;
    G.playBeats = ch.playBeats;
    G.totalBeats = COUNT + ch.playBeats;
    G.endTime = beatToTime(G.totalBeats) + 0.85;
    for (let i = 0; i < ch.notes.length; i++) {
      const n = ch.notes[i];
      notes.push({
        beat: n.beat,
        lane: n.lane,
        time: beatToTime(n.beat),
        judged: false,
        grade: '',
        pop: 0
      });
    }
    G.total = notes.length;
  }

  function buildDemo() {
    G.accel = false;
    G.kind = 'one';
    G.startBpm = 128;
    G.endBpm = 128;
    G.playBeats = 32;
    G.totalBeats = COUNT + 32;
    G.endTime = beatToTime(G.totalBeats);
    notes.length = 0;
    const pat = [0, 2, 1, 3, 0, 3, 1, 2];
    for (let b = COUNT; b < COUNT + 32; b += 0.5) {
      const i = ((b - COUNT) * 2) | 0;
      notes.push({
        beat: b,
        lane: pat[i % pat.length],
        time: beatToTime(b),
        judged: false,
        grade: '',
        pop: 0
      });
    }
    G.total = notes.length;
  }

  function resetJuice() {
    particles.length = 0;
    rings.length = 0;
    floats.length = 0;
    trails.length = 0;
    G.stop = 0;
    G.shake = 0;
    G.kickX = 0;
    G.kickY = 0;
    G.flash = 0;
    G.punch = 1;
    G.beatPulse = 0;
    G.judge = '';
    G.judgeT = 0;
  }

  function clearHolds() {
    for (let i = 0; i < 4; i++) {
      holdN[i] = 0;
      held[i] = false;
      recPulse[i] = 0;
      autoHoldT[i] = 0;
    }
    for (const k in ptrLane) delete ptrLane[k];
    for (let i = 0; i < padBtns.length; i++) padBtns[i].classList.remove('held');
  }

  function pressLane(lane, on) {
    if (lane < 0 || lane > 3) return;
    holdN[lane] += on ? 1 : -1;
    if (holdN[lane] < 0) holdN[lane] = 0;
    held[lane] = holdN[lane] > 0;
    if (padBtns[lane]) padBtns[lane].classList.toggle('held', held[lane]);
    if (on) recPulse[lane] = 1;
  }

  function showTitle() {
    G.mode = 'title';
    G.kind = 'one';
    G.accel = false;
    G.hp = HP_MAX;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    overlay.classList.remove('hidden');
    panel.classList.remove('win', 'lose');
    ovKicker.textContent = 'BEAT';
    ovTitle.textContent = '拍点';
    ovLead.innerHTML = '音符砸在判定线上。<br />卡在点上，连击发烫。';
    ovOps.textContent = OPS_TITLE;
    ovStart.classList.remove('gone');
    ovEnd.classList.add('gone');
    stageLabel.textContent = '一曲';
    tagLabel.textContent = 'BEAT';
    tagLabel.className = '';
    hintEl.textContent = '选一曲或加速 · D F J K 拍道 · A 自动';
    hintEl.className = 'hint';
    progFill.style.width = '0%';
    resetJuice();
    buildDemo();
    G.p0 = performance.now() / 1000;
    G.t0 = audio.ctx ? audio.ctx.currentTime : 0;
    G.schedBeat = 0;
    G.demoT = beatToTime(COUNT + 1.2);
    G.demoBeat = -1;
    hudPlay();
    scoreEl.textContent = '0';
    comboEl.textContent = '0';
    setHpHud();
    bpmLabel.textContent = '128 BPM';
    bpmLabel.classList.remove('hot');
  }

  function startPlay(kind) {
    audio.ensure();
    G.kind = kind === 'accel' ? 'accel' : 'one';
    G.accel = G.kind === 'accel';
    G.mode = 'play';
    G.seed = (Math.random() * 0xffffffff) >>> 0;
    if (G.seed === 0) G.seed = 1;
    const ch = buildChart(G.seed, G.accel);
    applyChart(ch);
    G.hp = HP_MAX;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.mult = 1;
    G.p = 0;
    G.g = 0;
    G.o = 0;
    G.m = 0;
    G.judged = 0;
    G.why = '';
    G.lastBpmShown = Math.round(G.startBpm);
    resetJuice();
    clearHolds();
    overlay.classList.add('hidden');
    panel.classList.remove('win', 'lose');
    G.p0 = performance.now() / 1000;
    G.t0 = audio.ctx ? audio.ctx.currentTime : 0;
    G.schedBeat = 0;
    G.playBeat = -1;
    audio.start();
    hudPlay();
    toast(G.accel ? '加速 · ' + G.startBpm + '→' + G.endBpm : '一曲 · ' + G.startBpm + ' BPM', false, true);
  }

  function accScore() {
    if (G.total <= 0) return 1;
    return (G.p + G.g * 0.65 + G.o * 0.3) / G.total;
  }

  function rankText() {
    if (G.m === 0 && G.g === 0 && G.o === 0 && G.p === G.total) return '彩';
    if (G.m === 0) return 'S';
    const a = accScore();
    if (a >= 0.96) return 'S';
    if (a >= 0.9) return 'A';
    if (a >= 0.8) return 'B';
    if (a >= 0.7) return 'C';
    return 'D';
  }

  function endGame(win) {
    if (G.mode !== 'play') return;
    G.stop = 0;
    clearHolds();
    if (win) {
      if (G.m === 0) addScore(5000);
      if (G.m === 0 && G.g === 0 && G.o === 0) addScore(10000);
    }
    G.mode = win ? 'win' : 'lose';
    if (win) {
      saveBest();
      audio.win();
      screenFlash(GOLD, 0.4);
    } else {
      audio.over();
      screenFlash(MAG, 0.5);
      kick(0, 1, 16);
      stageEl.classList.remove('die');
      void stageEl.offsetWidth;
      stageEl.classList.add('die');
    }
    overlay.classList.remove('hidden');
    panel.classList.toggle('win', win);
    panel.classList.toggle('lose', !win);
    ovStart.classList.add('gone');
    ovEnd.classList.remove('gone');
    const acc = (accScore() * 100).toFixed(1);
    const seedHex = ('00000000' + (G.seed >>> 0).toString(16)).slice(-8);
    if (win) {
      ovKicker.textContent = rankText();
      ovTitle.textContent = '通关';
      ovLead.innerHTML =
        '分数 ' + G.score + ' · 最高连击 ' + G.maxCombo +
        '<br />完美 ' + G.p + '　好 ' + G.g + '　差 ' + G.o + '　miss ' + G.m +
        '<br />准确 ' + acc + '% · 评级 ' + rankText();
    } else {
      ovKicker.textContent = 'BREAK';
      ovTitle.textContent = '失败';
      ovLead.innerHTML =
        (G.why || '血条见底') +
        '<br />分数 ' + G.score + ' · 最高连击 ' + G.maxCombo +
        '<br />完美 ' + G.p + '　好 ' + G.g + '　差 ' + G.o + '　miss ' + G.m;
    }
    ovOps.textContent = '谱 #' + seedHex + ' · ' + Math.round(G.startBpm) + (G.accel ? '→' + Math.round(G.endBpm) : '') + ' BPM · A 自动 · R 重开';
    hudPlay();
  }

  function changeHp(d) {
    const prev = G.hp;
    G.hp = clamp(G.hp + d, 0, HP_MAX);
    setHpHud();
    if (d < 0) {
      hpEl.classList.remove('hit');
      void hpEl.offsetWidth;
      hpEl.classList.add('hit');
      hpTok += 1;
      const tok = hpTok;
      setTimeout(function () {
        if (tok === hpTok) hpEl.classList.remove('hit');
      }, 280);
    }
    if (prev > 0 && G.hp <= 0) {
      G.why = '血条见底';
      endGame(false);
    }
  }

  function setJudge(name, col, late) {
    G.judge = name;
    G.judgeCol = col;
    G.judgeT = 0.55;
    G.judgeLate = late || 0;
  }

  function judgeNote(n, dt) {
    const ad = Math.abs(dt);
    let grade = 'm';
    if (ad <= WIN_P) grade = 'p';
    else if (ad <= WIN_G) grade = 'g';
    else if (ad <= WIN_O) grade = 'o';
    n.judged = true;
    n.grade = grade;
    n.pop = 1;
    G.judged += 1;
    recPulse[n.lane] = 1;
    if (grade === 'm') {
      G.m += 1;
      G.combo = 0;
      G.mult = 1;
      setComboHud();
      setJudge('MISS', MAG, 0);
      audio.hit(n.lane, 'm');
      burst(n.lane, 'm');
      kick(0, 1, 10);
      changeHp(-14);
      floatText(laneCX(n.lane, 1), HIT_Y - 28, 'MISS', MAG, 16, false);
      return;
    }
    G.combo += 1;
    if (G.combo > G.maxCombo) G.maxCombo = G.combo;
    G.mult = 1 + Math.min(7, Math.floor(G.combo / 10));
    setComboHud();
    const base = grade === 'p' ? 300 : grade === 'g' ? 200 : 50;
    const pts = base * G.mult;
    addScore(pts);
    const late = dt > WIN_P ? 1 : dt < -WIN_P ? -1 : 0;
    if (grade === 'p') {
      G.p += 1;
      setJudge('完美', GOLD, late);
      audio.hit(n.lane, 'p');
      burst(n.lane, 'p');
      hitStop(G.combo >= 40 ? 0.07 : G.combo >= 12 ? 0.055 : 0.042);
      kick(0, -1, 6 + Math.min(8, G.combo * 0.12));
      changeHp(4);
      floatText(laneCX(n.lane, 1), HIT_Y - 36, '+' + pts, GOLD, 15, G.combo >= 10);
    } else if (grade === 'g') {
      G.g += 1;
      setJudge('好', CYN, late);
      audio.hit(n.lane, 'g');
      burst(n.lane, 'g');
      hitStop(0.032);
      kick(0, -1, 4);
      changeHp(1);
      floatText(laneCX(n.lane, 1), HIT_Y - 34, '+' + pts, CYN, 14, false);
    } else {
      G.o += 1;
      setJudge('差', PEACH, late);
      audio.hit(n.lane, 'o');
      burst(n.lane, 'o');
      changeHp(-2);
      floatText(laneCX(n.lane, 1), HIT_Y - 32, '+' + pts, PEACH, 13, false);
    }
    if (G.combo === 10 || G.combo === 25 || G.combo === 50 || G.combo === 100) {
      audio.combo(G.combo);
      toast('连击 ' + G.combo, false, true);
      spark(VW * 0.5, HIT_Y - 80, GOLD, 18, 280);
    }
  }

  function hitLane(lane) {
    if (G.mode !== 'play') {
      if (G.mode === 'title') {
        audio.ensure();
        recPulse[lane] = 1;
        audio.hit(lane, 'p');
        burst(lane, 'p');
      }
      return;
    }
    const t = songTime();
    let found = null;
    for (let i = 0; i < notes.length; i++) {
      const n = notes[i];
      if (n.lane !== lane || n.judged) continue;
      const dt = t - n.time;
      if (dt > WIN_O) continue;
      if (dt >= -WIN_O) {
        found = n;
        break;
      }
      break;
    }
    if (!found) {
      audio.empty();
      recPulse[lane] = 0.6;
      return;
    }
    judgeNote(found, t - found.time);
  }

  function autoMiss(t) {
    for (let i = 0; i < notes.length; i++) {
      const n = notes[i];
      if (n.judged) continue;
      if (t - n.time > WIN_M) {
        n.judged = true;
        n.grade = 'm';
        n.pop = 1;
        G.judged += 1;
        G.m += 1;
        G.combo = 0;
        G.mult = 1;
        setComboHud();
        setJudge('MISS', MAG, 1);
        audio.hit(n.lane, 'm');
        burst(n.lane, 'm');
        kick(0, 1, 8);
        changeHp(-14);
        if (G.mode !== 'play') return;
      }
    }
  }

  function loadAutoSpeed() {
    try {
      const n = parseInt(localStorage.getItem(AUTO_SPEED_KEY) || '3', 10);
      if (!isFinite(n) || n < 1 || n > 4) return 3;
      return n;
    } catch (err) {
      return 3;
    }
  }

  function saveAutoSpeed(n) {
    try {
      localStorage.setItem(AUTO_SPEED_KEY, String(n));
    } catch (err) { /* ignore */ }
  }

  function syncAutoBtn() {
    if (!btnAuto) return;
    btnAuto.classList.toggle('on', autoOn);
    btnAuto.setAttribute('aria-pressed', autoOn ? 'true' : 'false');
    btnAuto.textContent = autoOn ? '停下' : '自动';
    btnAuto.setAttribute('aria-label', autoOn ? '停止自动' : '自动');
  }

  function syncSpeedUI() {
    if (!speedEl || !speedLab) return;
    speedEl.value = String(autoSpeed);
    speedLab.textContent = AUTO_SPEED_NAME[autoSpeed];
    speedEl.title = AUTO_SPEED_NAME[autoSpeed];
    speedEl.setAttribute('aria-valuetext', AUTO_SPEED_NAME[autoSpeed]);
  }

  function setAutoSpeed(n) {
    n = parseInt(n, 10);
    if (!isFinite(n) || n < 1 || n > 4) n = 3;
    autoSpeed = n;
    saveAutoSpeed(autoSpeed);
    syncSpeedUI();
  }

  function clearAutoHolds() {
    for (let i = 0; i < 4; i++) autoHoldT[i] = 0;
    clearHolds();
  }

  function toggleAuto() {
    autoOn = !autoOn;
    clearAutoHolds();
    syncAutoBtn();
    if (G.mode === 'play') hudPlay();
    if (!autoOn) return;
    audio.ensure();
    if (G.mode === 'title') startPlay('one');
  }

  function autoHoldDur() {
    if (autoSpeed <= 1) return 0.12;
    if (autoSpeed === 2) return 0.08;
    if (autoSpeed === 3) return 0.05;
    return 0.028;
  }

  function autoHitOffset() {
    if (autoSpeed <= 1) return 0.016;
    if (autoSpeed === 2) return 0.008;
    if (autoSpeed === 3) return 0;
    return -0.004;
  }

  function autoHitNote(n) {
    if (!n || n.judged || G.mode !== 'play') return;
    const t = songTime();
    const dt = t - n.time;
    if (dt < -WIN_O || dt > WIN_O) return;
    if (!held[n.lane]) pressLane(n.lane, true);
    autoHoldT[n.lane] = t + autoHoldDur();
    judgeNote(n, dt);
  }

  function tickAuto() {
    if (!autoOn || G.mode !== 'play') return;
    const t = songTime();
    for (let i = 0; i < 4; i++) {
      if (autoHoldT[i] > 0 && t >= autoHoldT[i]) {
        autoHoldT[i] = 0;
        if (held[i]) pressLane(i, false);
      }
    }
    const need = autoHitOffset();
    for (let i = 0; i < notes.length; i++) {
      const n = notes[i];
      if (n.judged) continue;
      const dt = t - n.time;
      if (dt < need) continue;
      if (dt > WIN_O) continue;
      autoHitNote(n);
      if (G.mode !== 'play') return;
    }
  }

  function pumpAudio(now) {
    if (!audio.ctx || G.mode === 'lose' || G.mode === 'win') return;
    const look = now + 0.16;
    const b1 = timeToBeat(look);
    let b = G.schedBeat;
    if (b < -0.5) b = -0.5;
    while (b <= b1 + 1e-6) {
      const when = G.t0 + beatToTime(b);
      if (when < audio.ctx.currentTime - 0.03) {
        b += 0.5;
        G.schedBeat = b;
        continue;
      }
      const down = Math.abs(b - Math.round(b)) < 1e-4;
      const ib = Math.round(b);
      const beatInBar = ((ib % 4) + 4) % 4;
      if (down) {
        if (G.mode === 'play' && b < COUNT) audio.click(when, beatInBar === 0);
        else audio.kick(when);
        if (beatInBar === 0) audio.bass(when, BASS[(((ib / 4) | 0) % BASS.length)]);
        if (beatInBar === 2 && G.mode === 'play' && b >= COUNT) audio.snare(when);
        audio.hat(when, beatInBar === 0 ? 1 : 0.75);
        if (G.mode === 'play' && G.hp <= 30 && beatInBar === 0) {
          audio.beep(880, 0.05, 'square', 0.03, 440, when);
        }
      } else {
        audio.hat(when, 0.45);
      }
      b += 0.5;
      G.schedBeat = b;
    }
  }

  function updateJuice(dt) {
    G.kickX *= Math.pow(0.04, dt);
    G.kickY *= Math.pow(0.04, dt);
    G.shake = Math.max(0, G.shake - dt * 18);
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.punch = lerp(G.punch, 1, 1 - Math.pow(0.0008, dt));
    G.beatPulse = Math.max(0, G.beatPulse - dt * 3.2);
    G.judgeT = Math.max(0, G.judgeT - dt);
    G.toastT = Math.max(0, G.toastT - dt);
    for (let i = 0; i < 4; i++) recPulse[i] = Math.max(0, recPulse[i] - dt * 5.5);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 520 * dt;
      p.vx *= 0.98;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].life -= dt;
      if (rings[i].life <= 0) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.life -= dt;
      f.y += f.vy * dt;
      f.vy *= 0.92;
      if (f.life <= 0) floats.splice(i, 1);
    }
    for (let i = trails.length - 1; i >= 0; i--) {
      trails[i].life -= dt;
      if (trails[i].life <= 0) trails.splice(i, 1);
    }
    for (let i = motes.length - 1; i >= 0; i--) {
      const m = motes[i];
      m.y += m.vy * dt;
      m.life -= dt;
      if (m.life <= 0 || m.y < -20) {
        motes[i] = spawnMote();
      }
    }
  }

  function spawnMote() {
    return {
      x: rand(0, VW),
      y: rand(0, VH),
      vy: rand(-18, -42),
      r: rand(0.6, 1.8),
      life: rand(4, 10),
      rgb: Math.random() < 0.5 ? MAG : CYN,
      a: rand(0.08, 0.22)
    };
  }

  function fillMotes() {
    while (motes.length < 28) motes.push(spawnMote());
  }

  function updateDemo(dt) {
    G.demoT += dt;
    const loop = beatToTime(COUNT + 32);
    if (G.demoT >= loop) {
      G.demoT -= loop;
      for (let i = 0; i < notes.length; i++) {
        notes[i].judged = false;
        notes[i].pop = 0;
      }
    }
    const t = G.demoT;
    const beat = timeToBeat(t);
    const ib = beat | 0;
    if (ib !== G.demoBeat) {
      G.demoBeat = ib;
      G.beatPulse = 1;
      const lane = ((ib * 3) | 0) % 4;
      recPulse[lane] = 1;
      if (ib % 2 === 0) burst(lane, ib % 4 === 0 ? 'p' : 'g');
    }
    for (let i = 0; i < notes.length; i++) {
      const n = notes[i];
      if (!n.judged && t >= n.time) {
        n.judged = true;
        n.pop = 1;
      }
    }
  }

  function updatePlay(dt) {
    const t = songTime();
    const beat = timeToBeat(t);
    const ib = Math.floor(beat + 1e-4);
    if (ib !== G.playBeat) {
      G.playBeat = ib;
      G.beatPulse = 1;
      const bpm = Math.round(bpmAtBeat(beat));
      if (G.accel && bpm >= G.lastBpmShown + 8) {
        G.lastBpmShown = bpm;
        toast('加速 ' + bpm, false, true);
      }
    }
    autoMiss(t);
    if (G.mode !== 'play') return;

    for (let i = 0; i < notes.length; i++) {
      const n = notes[i];
      if (n.judged) continue;
      const p = 1 - (n.beat - beat) / TRAVEL;
      if (p > 0.55 && p < 1.02 && (i + G.playBeat) % 2 === 0) {
        trails.push({
          x: laneCX(n.lane, p),
          y: yAt(p),
          rgb: LANE[n.lane].rgb,
          life: 0.18,
          max: 0.18,
          r: lerp(2, 5, clamp(p, 0, 1))
        });
        capArr(trails, 80);
      }
    }

    if (G.judged >= G.total && t >= G.endTime - 0.55) {
      endGame(true);
      return;
    }
    if (t >= G.endTime && G.mode === 'play') endGame(true);
  }

  function update(dt) {
    if (G.mode === 'play') pumpAudio(songTime());
    if (G.mode === 'play' && autoOn) tickAuto();
    if (G.stop > 0) {
      G.stop -= dt;
      if (G.stop < 0) G.stop = 0;
      if (G.stop > 0) return;
    }
    G.clock += dt;
    updateJuice(dt);
    if (G.mode === 'title') updateDemo(dt);
    else if (G.mode === 'play') updatePlay(dt);
  }

  function pAtY(y) {
    if (y <= TOP_Y) return 0;
    if (y >= HIT_Y) return 1 + clamp((y - HIT_Y) / (BOT_Y - HIT_Y), 0, 1) * 0.22;
    const t = clamp((y - TOP_Y) / (HIT_Y - TOP_Y), 0, 1);
    return Math.pow(t, 1 / 1.12);
  }

  function laneAt(cx, cy) {
    const x = (cx - ox) / scale;
    const y = (cy - oy) / scale;
    if (y < TOP_Y - 10 || y > BOT_Y + 8) return -1;
    const p = pAtY(y);
    const w = widthAt(Math.min(p, 1)) * VW;
    const left = VW * 0.5 - w * 0.5;
    const u = (x - left) / w;
    const lane = Math.floor(u * LANES);
    if (lane < 0 || lane > 3) return -1;
    return lane;
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

  function drawHighway(beat) {
    const p0 = 0;
    const p1 = 1.18;
    const x0 = laneLeft(p0);
    const x1 = laneLeft(p1);
    const w0 = widthAt(p0) * VW;
    const w1 = widthAt(p1) * VW;
    const y0 = yAt(p0);
    const y1 = lerp(HIT_Y, BOT_Y, 0.85);

    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0 + w0, y0);
    ctx.lineTo(x1 + w1, y1);
    ctx.lineTo(x1, y1);
    ctx.closePath();
    const grd = ctx.createLinearGradient(0, y0, 0, y1);
    grd.addColorStop(0, 'rgba(18, 8, 28, 0.2)');
    grd.addColorStop(0.7, 'rgba(18, 8, 32, 0.72)');
    grd.addColorStop(1, 'rgba(12, 4, 22, 0.9)');
    ctx.fillStyle = grd;
    ctx.fill();

    ctx.save();
    ctx.clip();
    const from = Math.floor(beat - 1);
    const to = Math.ceil(beat + TRAVEL + 1);
    for (let b = from; b <= to; b++) {
      const p = 1 - (b - beat) / TRAVEL;
      if (p < -0.05 || p > 1.2) continue;
      const y = yAt(p);
      const left = laneLeft(p);
      const w = widthAt(p) * VW;
      const bar = ((b % 4) + 4) % 4 === 0;
      ctx.strokeStyle = bar ? rgba(MAG, 0.22 + G.beatPulse * 0.12) : rgba(CYN, 0.08);
      ctx.lineWidth = bar ? 1.6 : 0.8;
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(left + w, y);
      ctx.stroke();
    }
    ctx.restore();

    for (let i = 0; i < LANES; i++) {
      if (!held[i] && recPulse[i] < 0.05) continue;
      const a = held[i] ? 0.16 : recPulse[i] * 0.14;
      const xa0 = x0 + (w0 / LANES) * i;
      const xa1 = x0 + (w0 / LANES) * (i + 1);
      const xb0 = x1 + (w1 / LANES) * i;
      const xb1 = x1 + (w1 / LANES) * (i + 1);
      ctx.beginPath();
      ctx.moveTo(xa0, y0);
      ctx.lineTo(xa1, y0);
      ctx.lineTo(xb1, y1);
      ctx.lineTo(xb0, y1);
      ctx.closePath();
      ctx.fillStyle = rgba(LANE[i].rgb, a);
      ctx.fill();
    }
    for (let i = 0; i <= LANES; i++) {
      const xa = x0 + (w0 / LANES) * i;
      const xb = x1 + (w1 / LANES) * i;
      ctx.beginPath();
      ctx.moveTo(xa, y0);
      ctx.lineTo(xb, y1);
      ctx.strokeStyle = i === 0 || i === LANES ? rgba(MAG, 0.42) : rgba(CYN, 0.22);
      ctx.lineWidth = i === 0 || i === LANES ? 2 : 1;
      ctx.stroke();
    }

    const glow = 0.35 + G.beatPulse * 0.45;
    const hy = HIT_Y;
    const hl = laneLeft(1);
    const hw = widthAt(1) * VW;
    ctx.save();
    ctx.shadowColor = rgba(GOLD, 0.7);
    ctx.shadowBlur = 18 + G.beatPulse * 16;
    ctx.strokeStyle = rgba(GOLD, 0.55 + glow * 0.35);
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(hl - 6, hy);
    ctx.lineTo(hl + hw + 6, hy);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = rgba(WHITE, 0.75);
    ctx.lineWidth = 1.1;
    ctx.stroke();
    ctx.restore();
  }

  function drawReceptors() {
    for (let i = 0; i < LANES; i++) {
      const p = 1.08;
      const x = laneCX(i, p);
      const y = REC_Y;
      const w = laneW(p) * 0.78;
      const h = 34;
      const on = held[i] || recPulse[i] > 0.04;
      const rgb = LANE[i].rgb;
      const a = on ? 0.95 : 0.55;
      ctx.save();
      if (on) {
        ctx.shadowColor = rgba(rgb, 0.85);
        ctx.shadowBlur = 18 + recPulse[i] * 16;
      }
      roundRect(x - w * 0.5, y - h * 0.5, w, h, 10);
      ctx.fillStyle = rgba(rgb, on ? 0.42 : 0.14);
      ctx.fill();
      ctx.strokeStyle = rgba(mix(rgb, WHITE, on ? 0.5 : 0.15), a);
      ctx.lineWidth = on ? 2.4 : 1.4;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = rgba(WHITE, on ? 0.95 : 0.7);
      ctx.font = '700 16px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(LANE[i].key, x, y + 0.5);
      ctx.restore();
    }
  }

  function drawNote(n, beat) {
    if (n.judged && n.pop <= 0) return;
    const p = 1 - (n.beat - beat) / TRAVEL;
    if (p < -0.08 || p > 1.25) return;
    const x = laneCX(n.lane, clamp(p, 0, 1.15));
    const y = yAt(clamp(p, -0.05, 1.15));
    const rgb = LANE[n.lane].rgb;
    let s = lerp(0.42, 1, clamp(p, 0, 1));
    if (n.judged) {
      s *= 1 + (1 - n.pop) * 0.8;
    }
    const w = laneW(clamp(p, 0, 1)) * 0.72 * s;
    const h = lerp(10, 20, clamp(p, 0, 1)) * s;
    const near = clamp((p - 0.72) / 0.28, 0, 1);
    ctx.save();
    ctx.globalAlpha = n.judged ? n.pop : p < 0 ? 0.35 : 1;
    ctx.shadowColor = rgba(rgb, 0.7);
    ctx.shadowBlur = 12 + near * 16;
    roundRect(x - w * 0.5, y - h * 0.5, w, h, h * 0.45);
    ctx.fillStyle = rgba(mix(rgb, WHITE, 0.12 + near * 0.25), 0.95);
    ctx.fill();
    ctx.strokeStyle = rgba(WHITE, 0.45 + near * 0.4);
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = rgba(WHITE, 0.35 + near * 0.4);
    roundRect(x - w * 0.22, y - h * 0.22, w * 0.28, h * 0.28, 4);
    ctx.fill();
    ctx.restore();
    if (n.judged) n.pop = Math.max(0, n.pop - 0.08);
  }

  function drawParticles() {
    for (let i = 0; i < trails.length; i++) {
      const t = trails[i];
      const u = t.life / t.max;
      ctx.beginPath();
      ctx.fillStyle = rgba(t.rgb, 0.35 * u);
      ctx.arc(t.x, t.y, t.r * (0.6 + u), 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const u = 1 - r.life / r.max;
      ctx.beginPath();
      ctx.strokeStyle = rgba(r.rgb, 0.7 * (1 - u));
      ctx.lineWidth = 2.4 * (1 - u);
      ctx.arc(r.x, r.y, r.r + u * 38, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const u = Math.max(0, p.life / (p.max || 0.5));
      ctx.beginPath();
      ctx.fillStyle = rgba(p.rgb, 0.15 + 0.85 * u);
      ctx.arc(p.x, p.y, p.r * (0.5 + u), 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const u = f.life / f.max;
      ctx.globalAlpha = u;
      ctx.fillStyle = rgba(f.rgb, 1);
      ctx.font = '800 ' + f.size + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(f.text, f.x, f.y);
      ctx.globalAlpha = 1;
    }
  }

  function drawJudge() {
    if (G.judgeT <= 0 || !G.judge) return;
    const u = G.judgeT / 0.55;
    const s = 1 + (1 - ease(1 - u)) * 0.35;
    ctx.save();
    ctx.translate(VW * 0.5, HIT_Y - 92);
    ctx.scale(s, s);
    ctx.globalAlpha = Math.min(1, u * 1.6);
    ctx.fillStyle = rgba(G.judgeCol, 1);
    ctx.shadowColor = rgba(G.judgeCol, 0.7);
    ctx.shadowBlur = 18;
    ctx.font = '900 36px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(G.judge, 0, 0);
    if (G.judgeLate && G.judge !== 'MISS' && G.judge !== '完美') {
      ctx.shadowBlur = 0;
      ctx.font = '700 13px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
      ctx.fillStyle = rgba(WHITE, 0.8);
      ctx.fillText(G.judgeLate > 0 ? '迟' : '早', 0, 26);
    }
    ctx.restore();
  }

  function drawCombo() {
    if (G.mode !== 'play' || G.combo < 2) return;
    const hot = G.combo >= 25;
    ctx.save();
    ctx.translate(VW * 0.5, HIT_Y - 168);
    const pop = G.combo >= 10 ? 1 + Math.min(0.12, G.combo * 0.0015) : 1;
    ctx.scale(pop, pop);
    ctx.textAlign = 'center';
    ctx.fillStyle = rgba(hot ? GOLD : WHITE, 0.95);
    ctx.shadowColor = rgba(hot ? GOLD : MAG, 0.6);
    ctx.shadowBlur = 16;
    ctx.font = '900 44px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
    ctx.fillText(String(G.combo), 0, 0);
    ctx.shadowBlur = 0;
    ctx.font = '700 12px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
    ctx.fillStyle = rgba(hot ? GOLD : CYN, 0.85);
    ctx.fillText('连击  ×' + G.mult, 0, 24);
    ctx.restore();
  }

  function drawCountIn(beat) {
    if (G.mode !== 'play' || beat >= COUNT) return;
    const n = Math.max(1, COUNT - Math.floor(beat));
    const frac = 1 - (beat - Math.floor(beat));
    ctx.save();
    ctx.globalAlpha = 0.35 + frac * 0.65;
    ctx.fillStyle = rgba(GOLD, 1);
    ctx.shadowColor = rgba(GOLD, 0.6);
    ctx.shadowBlur = 20;
    ctx.font = '900 72px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(n), VW * 0.5, VH * 0.38);
    ctx.restore();
  }

  function drawMotes() {
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      ctx.beginPath();
      ctx.fillStyle = rgba(m.rgb, m.a);
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#05030c';
    ctx.fillRect(0, 0, W, H);
    const g1 = ctx.createRadialGradient(W * 0.5, H * 0.08, 10, W * 0.5, H * 0.2, H * 0.7);
    g1.addColorStop(0, 'rgba(255,61,184,0.14)');
    g1.addColorStop(1, 'rgba(5,3,12,0)');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, W, H);

    const t = G.mode === 'title' ? (G.demoT % beatToTime(COUNT + 32)) : visTime();
    const beat = timeToBeat(Math.max(0, t));

    ctx.save();
    let sx = ox + G.kickX * scale;
    let sy = oy + G.kickY * scale;
    if (G.shake > 0.2) {
      sx += (Math.random() - 0.5) * G.shake * 0.35;
      sy += (Math.random() - 0.5) * G.shake * 0.35;
    }
    ctx.translate(sx, sy);
    ctx.scale(scale, scale);
    ctx.translate(VW * 0.5, VH * 0.5);
    ctx.scale(G.punch, G.punch);
    ctx.translate(-VW * 0.5, -VH * 0.5);

    drawMotes();
    drawHighway(beat);
    const order = [];
    for (let i = 0; i < notes.length; i++) order.push(notes[i]);
    order.sort(function (a, b) {
      return a.beat - b.beat;
    });
    for (let i = 0; i < order.length; i++) drawNote(order[i], beat);
    drawReceptors();
    drawParticles();
    drawCombo();
    drawJudge();
    drawCountIn(beat);

    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.35);
      ctx.fillRect(0, 0, VW, VH);
    }
    ctx.restore();
  }

  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.max(1, Math.min(2.25, window.devicePixelRatio || 1));
    W = Math.max(1, r.width | 0);
    H = Math.max(1, r.height | 0);
    canvas.width = (W * dpr) | 0;
    canvas.height = (H * dpr) | 0;
    const fit = Math.min(W / VW, H / VH);
    scale = fit;
    ox = (W - VW * scale) / 2;
    oy = (H - VH * scale) / 2;
  }

  let acc = 0;
  let last = 0;
  function frame(ts) {
    requestAnimationFrame(frame);
    if (!last) last = ts;
    let dt = (ts - last) / 1000;
    last = ts;
    if (dt > 0.05) dt = 0.05;
    acc += dt;
    while (acc >= STEP) {
      update(STEP);
      acc -= STEP;
    }
    draw();
    if (G.mode === 'play') {
      const bpm = Math.round(bpmAtBeat(timeToBeat(visTime())));
      if (bpmLabel.textContent !== bpm + ' BPM') hudPlay();
      const u = clamp(visTime() / G.endTime, 0, 1);
      progFill.style.width = (u * 100).toFixed(2) + '%';
    }
  }

  function onKey(e, down) {
    if (e.repeat) return;
    const code = e.code;
    const key = (e.key || '').toLowerCase();
    if (code === 'KeyM' || key === 'm') {
      if (down) {
        e.preventDefault();
        audio.ensure();
        audio.setMuted(!audio.muted);
      }
      return;
    }
    if (code === 'KeyR' || key === 'r') {
      if (down) {
        e.preventDefault();
        audio.ensure();
        if (G.mode === 'title') startPlay('one');
        else startPlay(G.kind);
      }
      return;
    }
    if (code === 'KeyA' || key === 'a') {
      if (down) {
        e.preventDefault();
        toggleAuto();
      }
      return;
    }
    if (down && (G.mode === 'title' || G.mode === 'win' || G.mode === 'lose')) {
      if (code === 'Enter' || code === 'Space' || key === '1') {
        e.preventDefault();
        if (G.mode === 'title') startPlay('one');
        else startPlay(G.kind);
        return;
      }
      if (key === '2' && G.mode === 'title') {
        e.preventDefault();
        startPlay('accel');
        return;
      }
      if ((key === 'q' || code === 'Escape') && (G.mode === 'win' || G.mode === 'lose')) {
        e.preventDefault();
        showTitle();
        return;
      }
    }
    let lane = -1;
    for (let i = 0; i < 4; i++) {
      if (code === LANE[i].code || key === LANE[i].ch) {
        lane = i;
        break;
      }
    }
    if (lane < 0) return;
    if (autoOn) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    audio.ensure();
    pressLane(lane, down);
    if (down) hitLane(lane);
  }

  canvas.addEventListener('pointerdown', function (e) {
    audio.ensure();
    canvas.setPointerCapture(e.pointerId);
    if (autoOn) return;
    const rect = canvas.getBoundingClientRect();
    const lane = laneAt(e.clientX - rect.left, e.clientY - rect.top);
    if (lane < 0) return;
    e.preventDefault();
    ptrLane[e.pointerId] = lane;
    pressLane(lane, true);
    hitLane(lane);
  });
  canvas.addEventListener('pointerup', function (e) {
    const lane = ptrLane[e.pointerId];
    if (lane == null) return;
    pressLane(lane, false);
    delete ptrLane[e.pointerId];
  });
  canvas.addEventListener('pointercancel', function (e) {
    const lane = ptrLane[e.pointerId];
    if (lane == null) return;
    pressLane(lane, false);
    delete ptrLane[e.pointerId];
  });
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  for (let i = 0; i < padBtns.length; i++) {
    (function (btn) {
      const lane = +btn.getAttribute('data-lane');
      btn.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        e.stopPropagation();
        audio.ensure();
        if (autoOn) return;
        btn.setPointerCapture(e.pointerId);
        ptrLane['p' + e.pointerId] = lane;
        pressLane(lane, true);
        hitLane(lane);
      });
      btn.addEventListener('pointerup', function (e) {
        const k = 'p' + e.pointerId;
        if (ptrLane[k] == null) return;
        pressLane(ptrLane[k], false);
        delete ptrLane[k];
      });
      btn.addEventListener('pointercancel', function (e) {
        const k = 'p' + e.pointerId;
        if (ptrLane[k] == null) return;
        pressLane(ptrLane[k], false);
        delete ptrLane[k];
      });
    })(padBtns[i]);
  }

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('blur', function () { clearHolds(); });
  window.addEventListener('resize', resize);

  document.addEventListener('visibilitychange', function () {
    if (!audio.ctx) return;
    if (document.hidden) audio.ctx.suspend();
    else audio.ctx.resume();
  });

  btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  if (btnAuto) btnAuto.addEventListener('click', function () { toggleAuto(); });
  if (speedEl) {
    speedEl.addEventListener('input', function () { setAutoSpeed(speedEl.value); });
    speedEl.addEventListener('change', function () { setAutoSpeed(speedEl.value); });
  }
  btnRetry.addEventListener('click', function () {
    audio.ensure();
    if (G.mode === 'title') startPlay('one');
    else startPlay(G.kind);
  });
  btnSong.addEventListener('click', function () {
    audio.ensure();
    startPlay('one');
  });
  btnAccel.addEventListener('click', function () {
    audio.ensure();
    startPlay('accel');
  });
  btnAgain.addEventListener('click', function () {
    audio.ensure();
    startPlay(G.kind);
  });
  btnMenu.addEventListener('click', function () {
    audio.ensure();
    showTitle();
  });

  try {
    audio.setMuted(localStorage.getItem(MUTE_KEY) === '1');
  } catch (err) {
    audio.setMuted(false);
  }
  autoSpeed = loadAutoSpeed();
  syncSpeedUI();
  syncAutoBtn();
  loadBest();
  fillMotes();
  resize();
  showTitle();
  requestAnimationFrame(frame);
})();
