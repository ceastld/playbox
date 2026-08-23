'use strict';

(function () {
  const VW = 800;
  const VH = 450;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 18000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.36;
  const OPT_GAP = 11;
  const OPT_MAX = 4;
  const SHIELD_MAX = 2;
  const BOSS_AT = 9800;
  const STAGE_END = [3200, 6400, 9800];
  const BEST_KEY = 'playbox-life-force-best';
  const MUTE_KEY = 'playbox-life-force-mute';
  const OPS = '←↑↓→ / WASD 飞 · 空格射击 · Shift / Z 换阵 · R 重开 · M 静音';
  const TITLE_LEAD = '横向穿行活体要塞。空格射击，Shift 换分身阵。撞壁、撞体、中弹都掉命。打穿三关后轰核。别当成沙罗、泽泽、潜猎或攀升——这是命力，不是巨蛇，不是触手，不是潜舰，不是燃油投弹。';
  const STAGE_NAME = ['膜廊', '肋堡', '核府'];
  const FORMS = ['trail', 'orbit', 'spread', 'lock'];
  const FORM_NAME = ['随', '环', '散', '锁'];
  const CAPS = ['speed', 'ripple', 'twin', 'option', 'shield'];
  const CAP_NAME = { speed: '加速', ripple: '涟射', twin: '双管', option: '分身', shield: '力场' };
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 136];
  const CYN = [0, 245, 168];
  const TEAL = [60, 255, 196];
  const GOLD = [255, 227, 107];
  const ORG = [255, 176, 112];
  const WHT = [230, 255, 244];
  const PNK = [255, 154, 196];
  const FLESH = [45, 106, 82];
  const BONE = [92, 156, 124];
  const DEEP = [8, 36, 28];
  const RED = [255, 72, 88];
  const VEIN = [196, 64, 96];

  const SCORE = {
    amoeba: 50, lead: 110, pod: 90, mote: 30,
    rib: 140, eye: 180, spin: 110, carrier: 280,
    sat: 200, core: 4500, cap: 80
  };

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
  const btnRaid = document.getElementById('btn-raid');
  const btnCore = document.getElementById('btn-core');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnOpt = document.getElementById('btn-opt');
  const btnPad = document.getElementById('btn-pad');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const formLabel = document.getElementById('form-label');
  const wpnLabel = document.getElementById('wpn-label');
  const orbLabel = document.getElementById('orb-label');
  const shdLabel = document.getElementById('shd-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const hpWrap = document.getElementById('hp-wrap');
  const hpBar = document.getElementById('hp-bar');

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
  let eid = 1;

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, hover: false, x: 88, y: VH * 0.5, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const motes = [];

  const G = {
    mode: 'title',
    kind: 'raid',
    t: 0,
    cam: 0,
    px: 88,
    py: VH * 0.5,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    stage: 1,
    cleared: 0,
    nextLife: LIFE_EVERY,
    ents: [],
    shots: [],
    eShots: [],
    options: [],
    trail: [],
    speed: 0,
    ripple: false,
    twin: false,
    shield: 0,
    form: 0,
    spawnedX: 0,
    fireCd: 0,
    fireHold: false,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: CYN,
    punch: 1,
    muzzle: 0,
    toastT: 0,
    why: '',
    boss: false,
    winT: 0,
    engine: 0,
    beat: 0
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
  function isDense() {
    return G.kind === 'core';
  }
  function pwx() {
    return G.cam + G.px;
  }
  function scrX(wx) {
    return wx - G.cam;
  }
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function stageAt(wx) {
    if (wx < STAGE_END[0]) return 1;
    if (wx < STAGE_END[1]) return 2;
    return 3;
  }
  function ribBump(wx, salt) {
    const p = 208;
    const m = (((wx + salt) % p) + p) % p;
    if (m < 74) {
      const u = m / 74;
      const tri = u < 0.5 ? u * 2 : (1 - u) * 2;
      return tri * tri;
    }
    return 0;
  }
  function valveSqueeze(wx) {
    const p = 740;
    const m = ((wx % p) + p) % p;
    if (m > 300 && m < 430) {
      const u = (m - 300) / 130;
      const tri = u < 0.5 ? u * 2 : (1 - u) * 2;
      return tri * tri;
    }
    return 0;
  }
  function fortAt(wx) {
    const st = stageAt(wx);
    const beat = REDUCE ? 0 : Math.sin(G.t * 2.15 + wx * 0.009) * (st === 3 ? 4.6 : 2.2);
    const rTop = ribBump(wx, 0);
    const rBot = ribBump(wx, 86);
    const valve = valveSqueeze(wx);
    const margin = st === 1 ? 16 : st === 2 ? 26 : 34;
    let top = margin + rTop * (20 + st * 9) + valve * (24 + st * 7) + beat;
    let bot = VH - margin - rBot * (18 + st * 9) - valve * (24 + st * 7) - beat;
    if (wx < 480) {
      const t = wx / 480;
      top = lerp(8, top, t);
      bot = lerp(VH - 8, bot, t);
    }
    if (G.boss) {
      top = Math.min(top, 44);
      bot = Math.max(bot, VH - 44);
    }
    if (top > bot - 100) {
      const mid = (top + bot) * 0.5;
      top = mid - 50;
      bot = mid + 50;
    }
    return { top: top, bot: bot };
  }
  function capRgb(kind) {
    if (kind === 'speed') return CYN;
    if (kind === 'ripple') return GOLD;
    if (kind === 'twin') return ORG;
    if (kind === 'option') return PNK;
    return TEAL;
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
    shoot(rip) {
      this.ensure();
      if (rip) {
        this.beep(520, 0.07, 'sine', 0.034, 1180);
        this.beep(880, 0.05, 'triangle', 0.02, 1540);
      } else {
        this.beep(720, 0.045, 'square', 0.03, 1480);
        this.beep(1100, 0.032, 'triangle', 0.016, 1680);
      }
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.55, combo * 0.035);
      this.noise(0.04, 0.032, 1100);
      this.beep(500 * lift, 0.07, 'square', 0.038, 820 * lift);
    },
    cap(kind) {
      this.ensure();
      if (kind === 'option') {
        this.beep(523, 0.07, 'square', 0.045, 784);
        this.beep(659, 0.08, 'triangle', 0.04, 1046);
        this.beep(784, 0.14, 'sine', 0.04, 1318);
      } else if (kind === 'ripple') {
        this.beep(220, 0.08, 'sine', 0.04, 880);
        this.beep(880, 0.14, 'triangle', 0.036, 1320);
      } else if (kind === 'twin') {
        this.beep(330, 0.07, 'square', 0.04, 660);
        this.beep(494, 0.1, 'triangle', 0.032, 988);
      } else if (kind === 'shield') {
        this.beep(392, 0.08, 'triangle', 0.04, 784);
        this.beep(523, 0.14, 'sine', 0.038, 1046);
        this.noise(0.08, 0.028, 700);
      } else {
        this.beep(392, 0.07, 'square', 0.042, 784);
        this.beep(784, 0.12, 'triangle', 0.036, 1175);
      }
    },
    form() {
      this.ensure();
      this.beep(440, 0.05, 'square', 0.036, 660);
      this.beep(660, 0.08, 'triangle', 0.03, 990);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.038, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.028, 1320);
    },
    shield() {
      this.ensure();
      this.noise(0.1, 0.05, 420);
      this.beep(880, 0.12, 'triangle', 0.04, 220);
    },
    death() {
      this.ensure();
      this.noise(0.2, 0.07, 240);
      this.beep(280, 0.24, 'sawtooth', 0.05, 62);
      this.beep(140, 0.36, 'sine', 0.042, 40);
    },
    up() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.045, 784);
      this.beep(784, 0.12, 'triangle', 0.04, 1046);
    },
    boom() {
      this.ensure();
      this.noise(0.26, 0.09, 150);
      this.beep(150, 0.32, 'sawtooth', 0.055, 44);
      this.beep(72, 0.44, 'sine', 0.04, 32);
    },
    check() {
      this.ensure();
      this.beep(196, 0.1, 'sine', 0.042, 392);
      this.beep(294, 0.14, 'triangle', 0.04, 587);
      this.beep(392, 0.2, 'sawtooth', 0.03, 784);
    },
    win() {
      this.ensure();
      this.beep(523, 0.12, 'square', 0.05, 784);
      this.beep(784, 0.16, 'triangle', 0.045, 1046);
      this.beep(1046, 0.28, 'sine', 0.04, 1568);
    },
    lose() {
      this.ensure();
      this.beep(196, 0.2, 'sawtooth', 0.04, 80);
      this.beep(120, 0.32, 'sine', 0.05, 44);
    },
    start() {
      this.ensure();
      this.beep(330, 0.09, 'square', 0.04, 659);
      this.beep(659, 0.14, 'triangle', 0.035, 988);
    },
    petal() {
      this.ensure();
      this.beep(240, 0.05, 'square', 0.028, 120);
      this.noise(0.04, 0.022, 1400);
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
  function loadMute() {
    try {
      return localStorage.getItem(MUTE_KEY) === '1';
    } catch (err) {
      return false;
    }
  }

  function addScore(n) {
    if ((G.mode !== 'play' && G.mode !== 'win') || n <= 0) return;
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

  function findCore() {
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].type === 'core' && G.ents[i].alive) return G.ents[i];
    }
    return null;
  }

  function wpnText() {
    if (G.ripple && G.twin) return '涟双';
    if (G.ripple) return '涟';
    if (G.twin) return '双';
    return '针';
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '命力';
      else if (G.boss) stageLabel.textContent = '核心';
      else stageLabel.textContent = '第 ' + G.stage + ' 关 · ' + (STAGE_NAME[G.stage - 1] || '');
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.stage >= 3 || G.boss));
    }
    if (tagLabel) {
      tagLabel.textContent = isDense() ? '核腔' : '命力';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1 || isDense());
      tagLabel.classList.toggle('hot', G.combo >= 8);
    }
    if (formLabel) {
      formLabel.textContent = FORM_NAME[G.form] || '随';
      formLabel.className = 'form ' + (FORMS[G.form] || 'trail');
    }
    if (wpnLabel) {
      wpnLabel.textContent = wpnText();
      wpnLabel.className = 'wpn ' + (G.ripple ? 'ripple' : G.twin ? 'twin' : 'needle');
    }
    if (orbLabel) {
      if (G.options.length > 0) {
        orbLabel.hidden = false;
        orbLabel.textContent = '球 ×' + G.options.length;
      } else orbLabel.hidden = true;
    }
    if (shdLabel) {
      if (G.shield > 0) {
        shdLabel.hidden = false;
        shdLabel.textContent = G.shield >= 2 ? '盾×2' : '盾';
      } else shdLabel.hidden = true;
    }
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = '连击 ×' + G.mult;
      } else comboEl.hidden = true;
    }
    const core = findCore();
    if (hpWrap) {
      const show = !!(G.boss && core && core.alive && G.mode === 'play');
      hpWrap.hidden = !show;
      if (show && hpBar) {
        const p = clamp(core.hp / core.max, 0, 1);
        hpBar.style.transform = 'scaleX(' + p + ')';
      }
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · Shift 换分身阵', 'warn');
    else if (G.mode === 'win') setHint('R 重开 · 核心尽破', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 撞壁也掉命', 'warn');
    else if (G.boss) setHint('从瓣缝打进核 · Shift 换阵散开火', 'hot');
    else if (G.options.length) setHint('Shift 换阵：随 / 环 / 散 / 锁', '');
    else setHint('吃命荚武装 · Shift 换分身阵 · 撞壁掉命', '');
    syncPips();
  }

  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'LFCE';
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
    const cls = mag >= 6 ? 'die' : mag >= 3.2 ? 'pow' : 'hit';
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    stageEl.classList.remove('pow');
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
        g: spec.g == null ? 280 : spec.g
      });
    }
    capArr(particles, 280);
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
    emit(Math.min(28, 10 + (p * 0.5) | 0), {
      x: x, y: y, j: 6,
      vx0: -220, vx1: 220, vy0: -180, vy1: 140,
      r0: 1.4, r1: 4.2, life: 0.42 + p * 0.006, rgb: rgb, g: 220
    });
    emit(6, {
      x: x, y: y, j: 3,
      vx0: -80, vx1: 80, vy0: -120, vy1: -20,
      r0: 2, r1: 5, life: 0.28, rgb: WHT, g: 80
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
      floatText(G.px + 18, G.py - 22, G.mult + ' 链', GOLD, true);
      if (comboEl) {
        comboEl.classList.remove('hot');
        void comboEl.offsetWidth;
        comboEl.classList.add('hot');
      }
    }
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = '连击 ×' + G.mult;
      } else comboEl.hidden = true;
    }
  }

  function breakCombo() {
    G.combo = 0;
    G.mult = 1;
    G.comboT = 0;
    if (comboEl) comboEl.hidden = true;
  }

  function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
    return Math.abs(ax - bx) < aw + bw && Math.abs(ay - by) < ah + bh;
  }

  function occupied(wx, y, rad) {
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      if (Math.abs(e.wx - wx) < rad && Math.abs(e.y - y) < rad * 0.8) return true;
    }
    return false;
  }

  function pushEnt(e) {
    e.id = eid++;
    if (e.alive == null) e.alive = true;
    if (e.flash == null) e.flash = 0;
    G.ents.push(e);
    capArr(G.ents, 130);
  }

  function moveSpd() {
    return (isDense() ? 300 : 268) + G.speed * 28;
  }

  function scrollSpd() {
    if (G.boss) {
      const b = findCore();
      if (b && b.alive) {
        const x = scrX(b.wx);
        if (x < VW * 0.58) return isDense() ? 36 : 24;
        if (x < VW * 0.7) return 14;
        return 0;
      }
    }
    const base = isDense() ? 132 : 96;
    return base + (G.stage - 1) * 8 + Math.min(18, G.combo * 0.5);
  }

  function capKind(slice) {
    return CAPS[(slice + (isDense() ? 2 : 0)) % CAPS.length];
  }

  function spawnAmoeba(wx, y, n, leadI) {
    const fort = fortAt(wx);
    y = clamp(y, fort.top + 26, fort.bot - 26);
    const dense = isDense();
    for (let i = 0; i < n; i++) {
      pushEnt({
        type: 'amoeba',
        wx: wx + i * 20,
        y: y + (i - (n - 1) * 0.5) * 10,
        hw: 9, hh: 7,
        hp: 1,
        vx: -(dense ? 88 : 68),
        phase: i * 0.5,
        lead: i === leadI,
        cd: rand(0.8, 1.8)
      });
    }
  }

  function spawnPod(wx, y) {
    const fort = fortAt(wx);
    y = clamp(y, fort.top + 30, fort.bot - 30);
    pushEnt({
      type: 'pod',
      wx: wx, y: y,
      hw: 12, hh: 12,
      hp: 2, max: 2,
      vx: -(isDense() ? 46 : 34),
      phase: rand(0, TAU),
      cd: rand(0.7, 1.6)
    });
  }

  function spawnRib(wx, ceil) {
    const fort = fortAt(wx);
    const y = ceil ? fort.top + 14 : fort.bot - 14;
    if (occupied(wx, y, 34)) return;
    pushEnt({
      type: 'rib',
      wx: wx, y: y,
      hw: 11, hh: 10,
      hp: isDense() ? 4 : 5,
      max: isDense() ? 4 : 5,
      ceil: !!ceil,
      cd: rand(0.5, 1.3),
      open: 0
    });
  }

  function spawnEye(wx, ceil) {
    const fort = fortAt(wx);
    const y = ceil ? fort.top + 18 : fort.bot - 18;
    if (occupied(wx, y, 36)) return;
    pushEnt({
      type: 'eye',
      wx: wx, y: y,
      hw: 14, hh: 12,
      hp: isDense() ? 5 : 6,
      max: isDense() ? 5 : 6,
      ceil: !!ceil,
      cd: rand(0.6, 1.4),
      open: 0
    });
  }

  function spawnSpin(wx, y) {
    const fort = fortAt(wx);
    y = clamp(y, fort.top + 34, fort.bot - 34);
    pushEnt({
      type: 'spin',
      wx: wx, y: y,
      hw: 13, hh: 13,
      hp: 3, max: 3,
      vx: -(isDense() ? 54 : 40),
      ang: rand(0, TAU),
      cd: rand(0.5, 1.2)
    });
  }

  function spawnCarrier(wx, y) {
    const fort = fortAt(wx);
    y = clamp(y, fort.top + 36, fort.bot - 36);
    pushEnt({
      type: 'carrier',
      wx: wx, y: y,
      hw: 16, hh: 11,
      hp: 4, max: 4,
      vx: -(isDense() ? 42 : 32),
      phase: rand(0, TAU)
    });
  }

  function spawnCap(wx, y, kind) {
    pushEnt({
      type: 'cap',
      kind: kind || capKind((wx / 40) | 0),
      wx: wx, y: y,
      hw: 10, hh: 10,
      hp: 1,
      spin: 0,
      vy: rand(-16, 16)
    });
  }

  function spawnSlice(wx) {
    if (G.boss) return;
    if (wx < 300) return;
    if (wx > BOSS_AT - 200) return;
    const st = stageAt(wx);
    const slice = (wx / 56) | 0;
    const h = hash2(slice * 19 + (isDense() ? 7 : 3) + G.stage * 11);
    const fort = fortAt(wx);
    const mid = (fort.top + fort.bot) * 0.5;
    const dens = isDense() ? 0.7 : 1;
    const waveEvery = isDense() ? 3 : 4;

    if (slice % waveEvery === 0 && h > 0.12 * dens) {
      const y = lerp(fort.top + 42, fort.bot - 42, hash2(slice + 44));
      const n = (isDense() ? 6 : 5) + (st === 3 ? 1 : 0);
      spawnAmoeba(wx, y, n, h > 0.48 ? 0 : -1);
    }
    if (slice % 8 === 3 && h > 0.28) {
      spawnAmoeba(wx + 10, mid + (h > 0.5 ? 38 : -38), isDense() ? 5 : 4, 0);
    }
    if (st >= 1 && slice % (isDense() ? 5 : 6) === 2 && h > 0.26 * dens) {
      spawnPod(wx, lerp(fort.top + 52, fort.bot - 52, hash2(slice + 3)));
    }
    if (st >= 2 && slice % (isDense() ? 4 : 5) === 1) {
      spawnRib(wx, h > 0.5);
      if (isDense() && h > 0.72) spawnRib(wx + 44, h <= 0.5);
    }
    if (st >= 2 && slice % 6 === 4 && h > 0.24) {
      spawnEye(wx, h > 0.52);
    }
    if (st >= 1 && slice % 7 === 5 && h > 0.3) {
      spawnSpin(wx, lerp(fort.top + 50, fort.bot - 50, hash2(slice + 9)));
    }
    if (slice % 11 === 2 && h > 0.2) {
      spawnCarrier(wx, mid + (h > 0.5 ? 24 : -24));
    }
    if (st === 3 && slice % 5 === 0 && h > 0.18) {
      spawnRib(wx, true);
      spawnRib(wx + 28, false);
    }
  }

  function spawnBoss() {
    G.boss = true;
    const hp = isDense() ? 138 : 108;
    const fort = fortAt(G.cam + VW * 0.72);
    const hy = (fort.top + fort.bot) * 0.5;
    pushEnt({
      type: 'core',
      wx: G.cam + VW * 0.9,
      y: hy,
      hw: 36, hh: 34,
      hp: hp,
      max: hp,
      spin: 0,
      phase: 0,
      cd: 0.8,
      beat: 0,
      angry: false
    });
    const n = isDense() ? 4 : 3;
    for (let i = 0; i < n; i++) {
      pushEnt({
        type: 'sat',
        wx: G.cam + VW * 0.9,
        y: hy,
        hw: 9, hh: 9,
        hp: 3, max: 3,
        idx: i,
        ang: i * TAU / n,
        cd: 0.6 + i * 0.2
      });
    }
    toast('核心苏醒', false, true);
    audio.check();
    kick(4.4);
    screenFlash(MAG, 0.4);
    syncHud();
  }

  function trySpawn() {
    if (!G.boss && G.mode === 'play') {
      if (G.cam + VW * 0.68 >= BOSS_AT) spawnBoss();
    }
    if (G.boss) return;
    const ahead = G.cam + VW + 96;
    while (G.spawnedX < ahead) {
      G.spawnedX += 56;
      spawnSlice(G.spawnedX);
    }
  }

  function seedMotes() {
    motes.length = 0;
    for (let i = 0; i < 52; i++) {
      motes.push({
        wx: hash2(i * 17) * 3200,
        y: 18 + hash2(i * 91 + 3) * (VH - 36),
        s: 0.6 + hash2(i * 5 + 9) * 2.2,
        p: 0.18 + hash2(i * 13) * 0.7,
        rgb: hash2(i * 3) > 0.55 ? CYN : PNK
      });
    }
  }

  function award(kind, x, y) {
    bumpCombo();
    const n = (SCORE[kind] || 10) * G.mult;
    addScore(n);
    const gold = kind === 'core' || kind === 'eye' || kind === 'carrier' || G.mult >= 3;
    floatText(scrX(x) < 0 ? G.px : scrX(x), y - 8, '+' + n, gold ? GOLD : WHT, gold);
  }

  function stripPowers() {
    G.speed = 0;
    G.ripple = false;
    G.twin = false;
    G.shield = 0;
    for (let i = 0; i < G.options.length; i++) {
      const o = G.options[i];
      explode(o.x, o.y, GOLD, 14);
    }
    G.options.length = 0;
    G.trail.length = 0;
  }

  function spawnOption() {
    if (G.options.length >= OPT_MAX) {
      toast('分身 MAX', false, true);
      addScore(500 * G.mult);
      audio.cap('option');
      return;
    }
    const last = G.trail.length ? G.trail[Math.max(0, G.trail.length - 8)] : { x: G.px - 18, y: G.py };
    const o = { x: last.x, y: last.y, t: 0, lx: -18, ly: 0 };
    if (G.form === 3) {
      o.lx = last.x - G.px;
      o.ly = last.y - G.py;
    }
    G.options.push(o);
    toast('分身 ×' + G.options.length + ' · ' + FORM_NAME[G.form], false, true);
    audio.cap('option');
    explode(last.x, last.y, GOLD, 18);
    popSpark(last.x, last.y, GOLD, 22);
    hitStop(0.05);
    kick(3.4);
    screenFlash(GOLD, 0.42);
    floatText(last.x, last.y - 14, 'OPT', GOLD, true);
  }

  function applyCap(kind, x, y) {
    addScore(SCORE.cap * G.mult);
    floatText(x, y - 12, CAP_NAME[kind] || kind, GOLD, true);
    if (kind === 'speed') {
      if (G.speed < 5) G.speed += 1;
      toast(G.speed >= 5 ? '加速 MAX' : '加速 ×' + G.speed, false, true);
      audio.cap('speed');
      kick(2.2);
      screenFlash(CYN, 0.28);
      emit(12, {
        x: G.px, y: G.py, j: 8,
        vx0: -40, vx1: 140, vy0: -80, vy1: 80,
        r0: 1.2, r1: 3, life: 0.28, rgb: CYN, g: 0
      });
    } else if (kind === 'ripple') {
      G.ripple = true;
      toast('涟射', false, true);
      audio.cap('ripple');
      kick(2.6);
      screenFlash(GOLD, 0.4);
      hitStop(0.042);
    } else if (kind === 'twin') {
      G.twin = true;
      toast('双管', false, true);
      audio.cap('twin');
      kick(2.4);
      screenFlash(ORG, 0.3);
    } else if (kind === 'option') {
      spawnOption();
    } else if (kind === 'shield') {
      G.shield = Math.min(SHIELD_MAX, G.shield + 1);
      toast(G.shield >= 2 ? '力场 ×2' : '力场', false, true);
      audio.cap('shield');
      kick(2.8);
      screenFlash(TEAL, 0.38);
      hitStop(0.04);
    }
    hitStop(0.038);
    popSpark(x, y, GOLD, 18);
    syncHud();
  }

  function collectCap(e) {
    e.alive = false;
    applyCap(e.kind, scrX(e.wx), e.y);
  }

  function enemyShot(wx, y, vx, vy, r) {
    G.eShots.push({
      wx: wx, y: y, vx: vx, vy: vy,
      r: r || 3.4, life: 3.6
    });
    capArr(G.eShots, 100);
  }

  function sources() {
    const list = [{ x: G.px + 12, y: G.py, i: -1 }];
    for (let i = 0; i < G.options.length; i++) {
      list.push({ x: G.options[i].x + 6, y: G.options[i].y, i: i });
    }
    return list;
  }

  function pushShot(s) {
    G.shots.push(s);
    capArr(G.shots, 96);
  }

  function fireOne(x, y, ang) {
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    if (G.ripple) {
      pushShot({
        type: 'rip',
        wx: G.cam + x,
        y: y,
        vx: 480 * c,
        vy: 480 * s,
        r: 5.4,
        grow: 24,
        life: 0.5,
        maxLife: 0.5,
        hit: {},
        dmg: 1
      });
    } else {
      pushShot({
        type: 'needle',
        wx: G.cam + x,
        y: y,
        vx: 640 * c,
        vy: 640 * s,
        hw: 9, hh: 2.2,
        life: 0.7,
        hit: {},
        dmg: 1
      });
    }
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.fireCd > 0) return;
    G.fireCd = G.ripple ? 0.118 : G.twin ? 0.092 : 0.102;
    G.muzzle = 0.06;
    audio.shoot(G.ripple);
    const srcs = sources();
    for (let i = 0; i < srcs.length; i++) {
      const s = srcs[i];
      let extra = 0;
      if (G.form === 2 && s.i >= 0) {
        extra = (s.y - G.py) * 0.012;
      }
      if (G.twin) {
        fireOne(s.x, s.y, extra - 0.22);
        fireOne(s.x, s.y, extra + 0.22);
        if (G.ripple) fireOne(s.x, s.y, extra);
      } else {
        fireOne(s.x, s.y, extra);
      }
    }
  }

  function cycleForm() {
    if (G.mode !== 'play' && G.mode !== 'title') return;
    G.form = (G.form + 1) % FORMS.length;
    if (G.form === 3) {
      for (let i = 0; i < G.options.length; i++) {
        G.options[i].lx = G.options[i].x - G.px;
        G.options[i].ly = G.options[i].y - G.py;
      }
    }
    toast('阵 · ' + FORM_NAME[G.form], false, true);
    audio.form();
    if (formLabel) {
      formLabel.classList.remove('flash');
      void formLabel.offsetWidth;
      formLabel.className = 'form ' + FORMS[G.form] + ' flash';
    }
    if (G.options.length) {
      hitStop(0.032);
      kick(2.2);
      screenFlash(GOLD, 0.22);
      floatText(G.px, G.py - 18, FORM_NAME[G.form], GOLD, true);
    }
    if (btnOpt) {
      btnOpt.classList.add('held');
      setTimeout(function () { if (btnOpt) btnOpt.classList.remove('held'); }, 140);
    }
    if (btnPad) {
      btnPad.classList.add('held');
      setTimeout(function () { if (btnPad) btnPad.classList.remove('held'); }, 140);
    }
    syncHud();
  }

  function updateTrail() {
    G.trail.push({ x: G.px, y: G.py });
    const need = OPT_MAX * OPT_GAP + 10;
    if (G.trail.length > need) G.trail.splice(0, G.trail.length - need);
  }

  function updateOptions(dt) {
    const n = G.options.length;
    for (let i = 0; i < n; i++) {
      const o = G.options[i];
      let tx = o.x;
      let ty = o.y;
      if (G.form === 1) {
        const ang = G.t * 2.35 + i * TAU / Math.max(1, n);
        const r = 26 + n * 3.2;
        tx = G.px + Math.cos(ang) * r;
        ty = G.py + Math.sin(ang) * r;
      } else if (G.form === 2) {
        tx = G.px - 6;
        ty = G.py + (i - (n - 1) * 0.5) * 22;
      } else if (G.form === 3) {
        tx = G.px + o.lx;
        ty = G.py + o.ly;
      } else {
        const idx = G.trail.length - 1 - (i + 1) * OPT_GAP;
        const t = idx >= 0 ? G.trail[idx] : G.trail[0] || { x: G.px - 20, y: G.py };
        tx = t.x;
        ty = t.y;
      }
      const k = G.form === 1 ? 0.42 : 0.28;
      o.x = lerp(o.x, tx, k);
      o.y = lerp(o.y, ty, k);
      o.x = clamp(o.x, 10, VW - 10);
      o.y = clamp(o.y, 10, VH - 10);
      o.t += dt;
    }
  }

  function updatePlayer(dt) {
    const spd = moveSpd();
    if (inputSrc === 'ptr' && (pointer.down || pointer.hover)) {
      const tx = clamp(pointer.x, 28, VW * 0.52);
      const ty = pointer.y;
      G.px += (tx - G.px) * Math.min(1, dt * 11);
      G.py += (ty - G.py) * Math.min(1, dt * 11);
    } else {
      let dx = 0;
      let dy = 0;
      if (keys.l) dx -= 1;
      if (keys.r) dx += 1;
      if (keys.u) dy -= 1;
      if (keys.d) dy += 1;
      if (dx && dy) {
        dx *= 0.707;
        dy *= 0.707;
      }
      G.px += dx * spd * dt;
      G.py += dy * spd * dt;
    }
    const fort = fortAt(pwx());
    G.px = clamp(G.px, 28, VW * 0.52);
    const top = fort.top + 10;
    const bot = fort.bot - 10;
    if (G.py < top || G.py > bot) {
      if (G.invuln > 0) {
        G.py = clamp(G.py, top + 2, bot - 2);
      } else {
        killPlayer();
        return;
      }
    }
    G.py = clamp(G.py, 8, VH - 8);
    G.engine += dt;
    updateTrail();
    updateOptions(dt);
  }

  function killPlayer() {
    if (G.deadT > 0 || G.invuln > 0) return;
    if (G.shield > 0) {
      G.shield -= 1;
      G.invuln = 0.52;
      explode(G.px, G.py, TEAL, 16);
      audio.shield();
      hitStop(0.055);
      kick(4.2);
      screenFlash(TEAL, 0.45);
      toast(G.shield > 0 ? '力场裂了' : '力场碎了', true, false);
      floatText(G.px, G.py - 16, '盾', TEAL, true);
      syncHud();
      return;
    }
    G.lives -= 1;
    G.deadT = 0.92;
    G.fireHold = false;
    breakCombo();
    explode(G.px, G.py, MAG, 28);
    emit(16, {
      x: G.px, y: G.py, j: 8,
      vx0: -260, vx1: 160, vy0: -200, vy1: 180,
      r0: 2, r1: 6, life: 0.5, rgb: MAG, g: 140
    });
    stripPowers();
    G.eShots.length = 0;
    audio.death();
    hitStop(0.075);
    kick(8);
    screenFlash(MAG, 0.55);
    syncHud();
    syncPips();
  }

  function respawn() {
    const fort = fortAt(pwx());
    G.px = 88;
    G.py = (fort.top + fort.bot) * 0.5;
    G.invuln = 1.5;
    G.deadT = 0;
    G.trail.length = 0;
    pointer.x = G.px;
    pointer.y = G.py;
    toast('重生', true, false);
    syncHud();
  }

  function coreOpen(ang, core) {
    const a = ((ang - core.spin) % TAU + TAU) % TAU;
    const petals = core.angry ? 4 : 3;
    const sector = TAU / petals;
    const gap = core.angry ? 0.52 : 0.7;
    return (a % sector) < gap;
  }

  function hurtCore(core, dmg, sxw, syw, through) {
    if (!core.alive) return false;
    const actual = through ? dmg : dmg * 0.14;
    core.hp -= actual;
    core.flash = through ? 0.1 : 0.05;
    if (through) {
      audio.hit(G.combo + 3);
      emit(8, {
        x: sxw, y: syw, j: 5,
        vx0: -90, vx1: 160, vy0: -100, vy1: 80,
        r0: 1.4, r1: 3.4, life: 0.26, rgb: GOLD, g: 40
      });
      bumpCombo();
      addScore(Math.round(40 * G.mult));
      hitStop(0.052);
      kick(3.6);
      floatText(sxw, syw - 10, '核', GOLD, true);
    } else {
      audio.petal();
      emit(4, {
        x: sxw, y: syw, j: 3,
        vx0: -60, vx1: 80, vy0: -50, vy1: 50,
        r0: 1, r1: 2.2, life: 0.16, rgb: BONE, g: 40
      });
      bumpCombo();
      hitStop(0.028);
      kick(1.4);
    }
    if (core.hp <= 0) {
      killCore(core);
      return true;
    }
    if (!core.angry && core.hp < core.max * 0.45) {
      core.angry = true;
      toast('核瓣狂转', true, false);
      screenFlash(MAG, 0.32);
      let nSat = 0;
      for (let i = 0; i < G.ents.length; i++) {
        if (G.ents[i].type === 'sat' && G.ents[i].alive) nSat += 1;
      }
      if (nSat < 4) {
        pushEnt({
          type: 'sat',
          wx: core.wx, y: core.y,
          hw: 9, hh: 9, hp: 3, max: 3,
          idx: 3, ang: Math.PI, cd: 0.4
        });
      }
    }
    syncHud();
    return false;
  }

  function killCore(core) {
    core.alive = false;
    core.hp = 0;
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if ((e.type === 'sat' || e.type === 'core') && e.alive) {
        e.alive = false;
        explode(scrX(e.wx), e.y, i % 2 ? MAG : GOLD, 22);
      }
    }
    G.eShots.length = 0;
    explode(scrX(core.wx), core.y, GOLD, 40);
    popSpark(scrX(core.wx), core.y, GOLD, 46);
    audio.boom();
    hitStop(0.085);
    kick(9);
    screenFlash(GOLD, 0.62);
    award('core', core.wx, core.y);
    addScore(1800 * G.mult);
    addScore(8000);
    floatText(VW * 0.5, VH * 0.4, '核心尽破', GOLD, true);
    G.winT = 1.6;
    G.cleared = 3;
    syncHud();
  }

  function hurtEnt(e, dmg, sxw, syw) {
    if (!e.alive) return false;
    if (e.type === 'cap') return false;
    if (e.type === 'core') {
      const dx = (G.cam + sxw) - e.wx;
      const dy = syw - e.y;
      const ang = Math.atan2(dy, dx);
      const dist = hypot(dx, dy);
      const through = dist < 18 && coreOpen(ang, e);
      return hurtCore(e, dmg, sxw, syw, through);
    }
    e.hp -= dmg;
    e.flash = 0.08;
    audio.hit(G.combo);
    emit(5, {
      x: sxw, y: syw, j: 4,
      vx0: -80, vx1: 140, vy0: -90, vy1: 70,
      r0: 1.2, r1: 2.8, life: 0.22, rgb: CYN, g: 40
    });
    if (e.hp > 0) {
      bumpCombo();
      hitStop(0.032);
      kick(1.6);
      return false;
    }
    e.alive = false;
    const kind = e.lead ? 'lead' : e.type;
    const rgb = e.lead || e.type === 'carrier' ? GOLD
      : (e.type === 'eye' || e.type === 'rib' ? MAG : TEAL);
    explode(sxw, syw, rgb, e.type === 'carrier' || e.type === 'eye' ? 22 : 16);
    hitStop(e.type === 'eye' || e.type === 'carrier' ? 0.055 : 0.038);
    kick(e.type === 'carrier' ? 4 : 2.6);
    award(kind, e.wx, e.y);
    if (e.type === 'carrier' || e.lead || (e.type === 'eye' && hash2(e.id * 13) > 0.62)) {
      spawnCap(e.wx, e.y, capKind(e.id));
    }
    if (e.type === 'pod') {
      for (let k = -1; k <= 1; k += 2) {
        pushEnt({
          type: 'mote',
          wx: e.wx, y: e.y + k * 8,
          hw: 6, hh: 6, hp: 1,
          vx: -76, vy: k * 54, phase: 0
        });
      }
    }
    return true;
  }

  function winGame() {
    G.mode = 'win';
    audio.win();
    showOverlay('win', '核心尽破', isDense()
      ? '核腔被你打穿。瓣还在耳膜里转。'
      : '三关走穿，核爆成光。要塞还在跳。');
    if (btnOvRetry) btnOvRetry.textContent = '再穿';
    if (btnOvModes) btnOvModes.textContent = isDense() ? '换模式' : '核腔';
    syncHud();
  }

  function loseGame() {
    G.mode = 'lose';
    audio.lose();
    showOverlay('lose', '要塞吞了你', '三命耗尽。肋堡还在收缩。R 再穿一次。');
    if (btnOvRetry) btnOvRetry.textContent = '再穿';
    if (btnOvModes) btnOvModes.textContent = '换模式';
    syncHud();
  }

  function checkStage() {
    const s = stageAt(G.cam + VW * 0.42);
    if (s > G.stage) {
      G.stage = s;
      G.cleared = s - 1;
      addScore(1500);
      toast('第 ' + s + ' 关 · ' + STAGE_NAME[s - 1], false, true);
      audio.check();
      kick(3.6);
      screenFlash(CYN, 0.32);
      hitStop(0.045);
      syncHud();
    }
  }

  function shotHitsEnt(s, e) {
    if (!e.alive) return false;
    if (e.type === 'cap') return false;
    const x = scrX(e.wx);
    const sxw = scrX(s.wx);
    if (e.type === 'core') {
      const dx = s.wx - e.wx;
      const dy = s.y - e.y;
      const dist = hypot(dx, dy);
      if (s.type === 'rip') {
        const u = 1 - s.life / s.maxLife;
        const r = s.r + s.grow * u;
        return dist < r + 28;
      }
      return dist < 42;
    }
    if (s.type === 'rip') {
      const u = 1 - s.life / s.maxLife;
      const r = s.r + s.grow * u;
      const dx = sxw - x;
      const dy = (s.y - e.y) * 1.35;
      return hypot(dx, dy) < r + Math.max(e.hw, e.hh) * 0.55;
    }
    return aabb(sxw, s.y, s.hw || 8, s.hh || 2.4, x, e.y, e.hw, e.hh);
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.wx += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      const x = scrX(s.wx);
      const fort = fortAt(s.wx);
      let dead = s.life <= 0 || x > VW + 40 || s.y < -20 || s.y > VH + 20;
      if (s.type !== 'rip' && (s.y < fort.top + 2 || s.y > fort.bot - 2)) dead = true;
      if (!dead) {
        for (let j = 0; j < G.ents.length; j++) {
          const e = G.ents[j];
          if (!e.alive || e.type === 'cap') continue;
          if (s.hit[e.id]) continue;
          if (!shotHitsEnt(s, e)) continue;
          s.hit[e.id] = true;
          const killed = hurtEnt(e, s.dmg || 1, x, s.y);
          if (s.type !== 'rip' || e.type === 'core') {
            if (!(s.type === 'rip' && !killed && e.type !== 'core')) dead = s.type !== 'rip';
            if (s.type !== 'rip') dead = true;
          }
          if (s.type === 'rip' && e.type === 'core') dead = true;
          if (dead) break;
        }
      }
      if (dead) G.shots.splice(i, 1);
    }
    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      s.wx += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      const x = scrX(s.wx);
      const fort = fortAt(s.wx);
      if (s.life <= 0 || x < -30 || x > VW + 40 || s.y < fort.top - 4 || s.y > fort.bot + 4) {
        G.eShots.splice(i, 1);
        continue;
      }
      if (G.deadT > 0 || G.invuln > 0) continue;
      if (hypot(x - G.px, s.y - G.py) < 8 + s.r) {
        G.eShots.splice(i, 1);
        killPlayer();
      }
    }
  }

  function aimAtPlayer(wx, y, spd) {
    const dx = pwx() - wx;
    const dy = G.py - y;
    const d = hypot(dx, dy) || 1;
    return { vx: dx / d * spd, vy: dy / d * spd };
  }

  function updateEnts(dt) {
    const core = findCore();
    for (let i = G.ents.length - 1; i >= 0; i--) {
      const e = G.ents[i];
      if (!e.alive) {
        G.ents.splice(i, 1);
        continue;
      }
      if (e.flash > 0) e.flash -= dt;
      const x = scrX(e.wx);
      if (e.type === 'cap') {
        e.spin += dt * 3.2;
        e.y += e.vy * dt;
        e.wx -= 28 * dt;
        const fort = fortAt(e.wx);
        e.y = clamp(e.y, fort.top + 16, fort.bot - 16);
        if (G.deadT <= 0 && hypot(x - G.px, e.y - G.py) < 18) collectCap(e);
        if (x < -40) e.alive = false;
        continue;
      }
      if (e.type === 'amoeba' || e.type === 'mote') {
        e.phase += dt * (e.type === 'mote' ? 5 : 2.4);
        e.wx += (e.vx || -70) * dt;
        e.y += Math.sin(e.phase) * (e.type === 'mote' ? 38 : 22) * dt;
        const fort = fortAt(e.wx);
        e.y = clamp(e.y, fort.top + 16, fort.bot - 16);
        if (e.type === 'amoeba') {
          e.cd -= dt;
          if (e.cd <= 0 && x < VW - 40 && x > 80 && (isDense() || G.stage >= 2)) {
            e.cd = isDense() ? 1.35 : 1.8;
            const a = aimAtPlayer(e.wx, e.y, isDense() ? 210 : 170);
            enemyShot(e.wx, e.y, a.vx, a.vy, 3.1);
          }
        }
      } else if (e.type === 'pod') {
        e.phase += dt * 1.6;
        e.wx += e.vx * dt;
        e.y += Math.sin(e.phase) * 16 * dt;
        e.cd -= dt;
        if (e.cd <= 0 && x < VW - 30 && x > 60) {
          e.cd = isDense() ? 1.1 : 1.5;
          enemyShot(e.wx, e.y, -220, Math.sin(e.phase) * 80, 3.4);
        }
      } else if (e.type === 'rib') {
        const fort = fortAt(e.wx);
        e.y = e.ceil ? fort.top + 14 : fort.bot - 14;
        e.cd -= dt;
        e.open = Math.max(0, e.open - dt);
        if (e.cd <= 0 && x < VW - 20 && x > 40) {
          e.cd = isDense() ? 0.95 : 1.28;
          e.open = 0.22;
          const a = aimAtPlayer(e.wx, e.y, isDense() ? 240 : 190);
          enemyShot(e.wx, e.y, a.vx, a.vy, 3.6);
        }
      } else if (e.type === 'eye') {
        const fort = fortAt(e.wx);
        e.y = e.ceil ? fort.top + 18 : fort.bot - 18;
        e.cd -= dt;
        e.open = 0.5 + Math.sin(G.t * 2.4 + e.id) * 0.5;
        if (e.open > 0.55 && e.cd <= 0 && x < VW - 16 && x > 30) {
          e.cd = isDense() ? 0.85 : 1.15;
          const a = aimAtPlayer(e.wx, e.y, isDense() ? 260 : 210);
          enemyShot(e.wx, e.y, a.vx, a.vy, 4);
        }
      } else if (e.type === 'spin') {
        e.ang += dt * 2.6;
        e.wx += e.vx * dt;
        e.cd -= dt;
        if (e.cd <= 0 && x < VW - 24 && x > 50) {
          e.cd = isDense() ? 1.05 : 1.4;
          for (let k = 0; k < 4; k++) {
            const a = e.ang + k * TAU / 4;
            enemyShot(e.wx, e.y, Math.cos(a) * 180, Math.sin(a) * 180, 3.2);
          }
        }
      } else if (e.type === 'carrier') {
        e.phase += dt * 1.8;
        e.wx += e.vx * dt;
        e.y += Math.sin(e.phase) * 28 * dt;
        const fort = fortAt(e.wx);
        e.y = clamp(e.y, fort.top + 22, fort.bot - 22);
      } else if (e.type === 'core') {
        e.phase += dt * (e.angry ? 1.45 : 1);
        e.spin += dt * (e.angry ? 1.55 : 0.85);
        e.beat += dt;
        const fort = fortAt(e.wx);
        const mid = (fort.top + fort.bot) * 0.5;
        const amp = (fort.bot - fort.top) * 0.16;
        e.y = clamp(mid + Math.sin(e.phase * 1.2) * amp, fort.top + 48, fort.bot - 48);
        const want = G.cam + VW * (e.angry ? 0.68 : 0.72);
        if (e.wx > want) e.wx -= 48 * dt;
        else e.wx = want;
        e.cd -= dt;
        if (e.cd <= 0) {
          e.cd = e.angry ? 0.82 : 1.28;
          const n = e.angry ? 10 : 7;
          const base = e.spin;
          for (let k = 0; k < n; k++) {
            const a = base + k * TAU / n;
            if (!coreOpen(a, e) && k % 2 === 0) continue;
            enemyShot(e.wx, e.y, Math.cos(a) * (e.angry ? 200 : 160), Math.sin(a) * (e.angry ? 200 : 160), e.angry ? 4.2 : 3.6);
          }
          if (e.angry) {
            const a = aimAtPlayer(e.wx, e.y, 240);
            enemyShot(e.wx, e.y, a.vx, a.vy, 5);
          }
        }
      } else if (e.type === 'sat') {
        if (!core || !core.alive) {
          e.alive = false;
          explode(x, e.y, MAG, 14);
          continue;
        }
        e.ang += dt * (core.angry ? 1.8 : 1.15);
        const r = 58 + Math.sin(G.t * 2 + e.idx) * 6;
        e.wx = core.wx + Math.cos(e.ang) * r;
        e.y = core.y + Math.sin(e.ang) * r * 0.78;
        e.cd -= dt;
        if (e.cd <= 0 && x > 40 && x < VW - 10) {
          e.cd = isDense() || (core && core.angry) ? 1.05 : 1.45;
          const a = aimAtPlayer(e.wx, e.y, 200);
          enemyShot(e.wx, e.y, a.vx, a.vy, 3.3);
        }
      }
      if (e.type !== 'core' && e.type !== 'sat' && x < -60) e.alive = false;

      if (G.deadT <= 0 && G.invuln <= 0 && e.alive && e.type !== 'cap') {
        let eh = e.hh;
        let ew = e.hw;
        let ey = e.y;
        if (e.type === 'core') {
          ew = 28;
          eh = 26;
        }
        if (aabb(G.px, G.py, 8, 6, x, ey, ew * 0.85, eh * 0.85)) {
          killPlayer();
        }
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
      f.vy += 40 * dt;
      if (f.t > f.life) floats.splice(i, 1);
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    G.punch = lerp(G.punch, 1, Math.min(1, dt * 10));
    if (G.muzzle > 0) G.muzzle = Math.max(0, G.muzzle - dt);
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0 && toastEl) toastEl.classList.add('hidden');
    }
  }

  function step(dt) {
    G.t += dt;
    G.beat += dt;
    if (G.mode === 'title') {
      G.cam += 42 * dt;
      updateFx(dt);
      return;
    }
    if (G.mode !== 'play' && G.mode !== 'win') {
      updateFx(dt);
      return;
    }
    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt);
      return;
    }
    if (G.deadT > 0) {
      G.deadT -= dt;
      G.cam += scrollSpd() * 0.35 * dt;
      updateEnts(dt);
      updateShots(dt);
      updateFx(dt);
      if (G.deadT <= 0) {
        if (G.lives <= 0) loseGame();
        else respawn();
      }
      return;
    }
    if (G.invuln > 0) G.invuln -= dt;
    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }
    if (G.mode === 'play') {
      updatePlayer(dt);
      G.cam += scrollSpd() * dt;
      checkStage();
      trySpawn();
      if (G.fireHold) fire();
    }
    updateEnts(dt);
    updateShots(dt);
    updateFx(dt);
    if (G.winT > 0) {
      G.winT -= dt;
      if (G.winT <= 0) winGame();
    }
  }

  function drawMotes() {
    const c = ctx;
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const x = ((m.wx - G.cam * m.p) % (VW + 80) + (VW + 80)) % (VW + 80) - 20;
      c.fillStyle = rgba(m.rgb, 0.22 + Math.sin(G.t * 2 + i) * 0.08);
      c.beginPath();
      c.arc(sx(x), sy(m.y), m.s * scale, 0, TAU);
      c.fill();
    }
  }

  function drawFort() {
    const c = ctx;
    const stepX = 8;
    c.beginPath();
    c.moveTo(sx(0), sy(0));
    for (let x = 0; x <= VW; x += stepX) {
      const f = fortAt(G.cam + x);
      c.lineTo(sx(x), sy(f.top));
    }
    c.lineTo(sx(VW), sy(0));
    c.closePath();
    const gTop = c.createLinearGradient(sx(0), sy(0), sx(0), sy(80));
    gTop.addColorStop(0, '#0a241c');
    gTop.addColorStop(1, rgba(FLESH, 0.95));
    c.fillStyle = gTop;
    c.fill();
    c.beginPath();
    c.moveTo(sx(0), sy(VH));
    for (let x = 0; x <= VW; x += stepX) {
      const f = fortAt(G.cam + x);
      c.lineTo(sx(x), sy(f.bot));
    }
    c.lineTo(sx(VW), sy(VH));
    c.closePath();
    const gBot = c.createLinearGradient(sx(0), sy(VH), sx(0), sy(VH - 80));
    gBot.addColorStop(0, '#0a241c');
    gBot.addColorStop(1, rgba(FLESH, 0.95));
    c.fillStyle = gBot;
    c.fill();

    c.strokeStyle = rgba(CYN, 0.35 + Math.sin(G.t * 2.15) * 0.08);
    c.lineWidth = Math.max(1.2, 1.6 * scale);
    c.beginPath();
    for (let x = 0; x <= VW; x += stepX) {
      const f = fortAt(G.cam + x);
      if (x === 0) c.moveTo(sx(x), sy(f.top));
      else c.lineTo(sx(x), sy(f.top));
    }
    c.stroke();
    c.beginPath();
    for (let x = 0; x <= VW; x += stepX) {
      const f = fortAt(G.cam + x);
      if (x === 0) c.moveTo(sx(x), sy(f.bot));
      else c.lineTo(sx(x), sy(f.bot));
    }
    c.stroke();

    c.strokeStyle = rgba(BONE, 0.55);
    c.lineWidth = Math.max(1.4, 2.2 * scale);
    for (let x = -((G.cam | 0) % 208); x < VW + 40; x += 208) {
      const f = fortAt(G.cam + x + 36);
      c.beginPath();
      c.moveTo(sx(x + 10), sy(0));
      c.lineTo(sx(x + 36), sy(f.top + 2));
      c.lineTo(sx(x + 62), sy(0));
      c.stroke();
      const fb = fortAt(G.cam + x + 36 + 86);
      c.beginPath();
      c.moveTo(sx(x + 96), sy(VH));
      c.lineTo(sx(x + 122), sy(fb.bot - 2));
      c.lineTo(sx(x + 148), sy(VH));
      c.stroke();
    }

    c.strokeStyle = rgba(VEIN, 0.28);
    c.lineWidth = Math.max(1, scale);
    for (let i = 0; i < 6; i++) {
      const y0 = 8 + i * 7;
      c.beginPath();
      for (let x = 0; x <= VW; x += 16) {
        const yy = y0 + Math.sin((G.cam + x) * 0.02 + i) * 5;
        if (x === 0) c.moveTo(sx(x), sy(yy));
        else c.lineTo(sx(x), sy(yy));
      }
      c.stroke();
    }
  }

  function drawEnts() {
    const c = ctx;
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      const x = scrX(e.wx);
      if (x < -50 || x > VW + 50) continue;
      const flash = e.flash > 0;
      if (e.type === 'amoeba' || e.type === 'mote') {
        const r = e.type === 'mote' ? 5.2 : 8.5;
        c.fillStyle = rgba(flash ? WHT : (e.lead ? GOLD : TEAL), 0.92);
        c.beginPath();
        c.ellipse(sx(x), sy(e.y), r * scale, r * 0.72 * scale, Math.sin(e.phase) * 0.4, 0, TAU);
        c.fill();
        c.fillStyle = rgba(e.lead ? MAG : DEEP, 0.9);
        c.beginPath();
        c.arc(sx(x + 1.5), sy(e.y - 1), (e.lead ? 2.6 : 2) * scale, 0, TAU);
        c.fill();
      } else if (e.type === 'pod') {
        const p = 1 + Math.sin(e.phase * 2) * 0.08;
        c.fillStyle = rgba(flash ? WHT : MAG, 0.9);
        c.beginPath();
        c.arc(sx(x), sy(e.y), 11 * p * scale, 0, TAU);
        c.fill();
        c.fillStyle = rgba(GOLD, 0.85);
        c.beginPath();
        c.arc(sx(x - 2), sy(e.y - 2), 3.4 * scale, 0, TAU);
        c.fill();
      } else if (e.type === 'rib') {
        c.fillStyle = rgba(flash ? WHT : BONE, 0.95);
        c.beginPath();
        if (e.ceil) {
          c.moveTo(sx(x - 10), sy(e.y - 12));
          c.lineTo(sx(x + 10), sy(e.y - 12));
          c.lineTo(sx(x + 6), sy(e.y + 10));
          c.lineTo(sx(x - 6), sy(e.y + 10));
        } else {
          c.moveTo(sx(x - 10), sy(e.y + 12));
          c.lineTo(sx(x + 10), sy(e.y + 12));
          c.lineTo(sx(x + 6), sy(e.y - 10));
          c.lineTo(sx(x - 6), sy(e.y - 10));
        }
        c.closePath();
        c.fill();
        c.fillStyle = rgba(e.open > 0 ? RED : MAG, 0.9);
        c.beginPath();
        c.arc(sx(x), sy(e.y), 3.2 * scale, 0, TAU);
        c.fill();
      } else if (e.type === 'eye') {
        const open = 0.25 + e.open * 0.75;
        c.fillStyle = rgba(flash ? WHT : FLESH, 0.95);
        c.beginPath();
        c.ellipse(sx(x), sy(e.y), 14 * scale, 11 * open * scale, 0, 0, TAU);
        c.fill();
        c.fillStyle = rgba(GOLD, 0.95);
        c.beginPath();
        c.arc(sx(x), sy(e.y), 4.2 * open * scale, 0, TAU);
        c.fill();
        c.fillStyle = '#031814';
        c.beginPath();
        c.arc(sx(x + 1), sy(e.y), 1.8 * open * scale, 0, TAU);
        c.fill();
      } else if (e.type === 'spin') {
        c.save();
        c.translate(sx(x), sy(e.y));
        c.rotate(e.ang);
        c.fillStyle = rgba(flash ? WHT : CYN, 0.9);
        c.beginPath();
        for (let k = 0; k < 6; k++) {
          const a = k * TAU / 6;
          const rr = k % 2 ? 13 : 7;
          const px = Math.cos(a) * rr * scale;
          const py = Math.sin(a) * rr * scale;
          if (k === 0) c.moveTo(px, py);
          else c.lineTo(px, py);
        }
        c.closePath();
        c.fill();
        c.fillStyle = rgba(MAG, 0.9);
        c.beginPath();
        c.arc(0, 0, 3 * scale, 0, TAU);
        c.fill();
        c.restore();
      } else if (e.type === 'carrier') {
        c.fillStyle = rgba(flash ? WHT : GOLD, 0.92);
        c.beginPath();
        c.ellipse(sx(x), sy(e.y), 16 * scale, 10 * scale, 0, 0, TAU);
        c.fill();
        c.fillStyle = rgba(DEEP, 0.85);
        c.fillRect(sx(x - 6), sy(e.y - 4), 12 * scale, 8 * scale);
        c.strokeStyle = rgba(CYN, 0.7);
        c.lineWidth = Math.max(1, scale);
        c.strokeRect(sx(x - 6), sy(e.y - 4), 12 * scale, 8 * scale);
      } else if (e.type === 'cap') {
        const rgb = capRgb(e.kind);
        const r = 8 + Math.sin(e.spin * 2) * 1.2;
        c.fillStyle = rgba(rgb, 0.95);
        c.beginPath();
        c.arc(sx(x), sy(e.y), r * scale, 0, TAU);
        c.fill();
        c.strokeStyle = rgba(WHT, 0.8);
        c.lineWidth = Math.max(1, 1.4 * scale);
        c.beginPath();
        c.arc(sx(x), sy(e.y), (r + 4) * scale, e.spin, e.spin + 2.2);
        c.stroke();
        c.fillStyle = rgba(WHT, 0.9);
        c.beginPath();
        c.arc(sx(x - 1.5), sy(e.y - 1.5), 2 * scale, 0, TAU);
        c.fill();
      } else if (e.type === 'sat') {
        c.fillStyle = rgba(flash ? WHT : MAG, 0.95);
        c.beginPath();
        c.arc(sx(x), sy(e.y), 8 * scale, 0, TAU);
        c.fill();
        c.fillStyle = rgba(GOLD, 0.9);
        c.beginPath();
        c.arc(sx(x - 1), sy(e.y - 1), 2.6 * scale, 0, TAU);
        c.fill();
        c.strokeStyle = rgba(CYN, 0.5);
        c.lineWidth = Math.max(1, scale);
        c.beginPath();
        c.arc(sx(x), sy(e.y), 10.5 * scale, 0, TAU);
        c.stroke();
      } else if (e.type === 'core') {
        drawCore(e, x);
      }
    }
  }

  function drawCore(e, x) {
    const c = ctx;
    const flash = e.flash > 0;
    const beat = 1 + Math.sin(G.t * (e.angry ? 6 : 3.4)) * 0.06;
    const petals = e.angry ? 4 : 3;
    const sector = TAU / petals;
    const gap = e.angry ? 0.52 : 0.7;
    c.save();
    c.translate(sx(x), sy(e.y));
    for (let i = 0; i < petals; i++) {
      const a0 = e.spin + i * sector + gap;
      const a1 = e.spin + (i + 1) * sector;
      c.fillStyle = rgba(flash ? WHT : BONE, 0.92);
      c.beginPath();
      c.moveTo(0, 0);
      c.arc(0, 0, 46 * beat * scale, a0, a1);
      c.closePath();
      c.fill();
      c.strokeStyle = rgba(CYN, 0.45);
      c.lineWidth = Math.max(1, 1.4 * scale);
      c.stroke();
    }
    c.fillStyle = rgba(flash ? WHT : VEIN, 0.95);
    c.beginPath();
    c.ellipse(0, 0, 20 * beat * scale, 17 * beat * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(GOLD, 0.95);
    c.beginPath();
    c.arc(0, 0, 9.5 * beat * scale, 0, TAU);
    c.fill();
    c.fillStyle = rgba(MAG, 0.9);
    c.beginPath();
    c.arc(0, 0, 4.2 * beat * scale, 0, TAU);
    c.fill();
    c.strokeStyle = rgba(GOLD, 0.55 + Math.sin(G.t * 5) * 0.2);
    c.lineWidth = Math.max(1.2, 1.8 * scale);
    c.beginPath();
    c.arc(0, 0, 24 * beat * scale, 0, TAU);
    c.stroke();
    c.restore();
  }

  function drawShots() {
    const c = ctx;
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      const x = scrX(s.wx);
      if (s.type === 'rip') {
        const u = 1 - s.life / s.maxLife;
        const r = s.r + s.grow * u;
        c.strokeStyle = rgba(GOLD, 0.9 - u * 0.45);
        c.lineWidth = Math.max(1.2, (2.4 - u) * scale);
        c.beginPath();
        c.ellipse(sx(x), sy(s.y), r * scale, r * 0.62 * scale, 0, 0, TAU);
        c.stroke();
        c.strokeStyle = rgba(WHT, 0.55);
        c.lineWidth = Math.max(1, scale);
        c.beginPath();
        c.ellipse(sx(x), sy(s.y), r * 0.55 * scale, r * 0.34 * scale, 0, 0, TAU);
        c.stroke();
      } else {
        c.fillStyle = rgba(CYN, 0.95);
        c.beginPath();
        c.ellipse(sx(x), sy(s.y), 8 * scale, 2.3 * scale, 0, 0, TAU);
        c.fill();
        c.fillStyle = rgba(WHT, 0.85);
        c.fillRect(sx(x - 2), sy(s.y - 1), 7 * scale, 2 * scale);
      }
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      const x = scrX(s.wx);
      c.fillStyle = rgba(MAG, 0.9);
      c.beginPath();
      c.arc(sx(x), sy(s.y), s.r * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 0.7);
      c.beginPath();
      c.arc(sx(x - 0.8), sy(s.y - 0.8), s.r * 0.35 * scale, 0, TAU);
      c.fill();
    }
  }

  function drawPlayer() {
    if (G.deadT > 0) return;
    const c = ctx;
    const blink = G.invuln > 0 && ((G.invuln * 18) | 0) % 2 === 0;
    if (blink) return;
    for (let i = 0; i < G.options.length; i++) {
      const o = G.options[i];
      const pulse = 1 + Math.sin(G.t * 8 + i) * 0.08;
      c.fillStyle = rgba(GOLD, 0.92);
      c.beginPath();
      c.arc(sx(o.x), sy(o.y), 6.2 * pulse * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(MAG, 0.85);
      c.beginPath();
      c.arc(sx(o.x), sy(o.y), 2.4 * scale, 0, TAU);
      c.fill();
      c.strokeStyle = rgba(G.form === 1 ? GOLD : G.form === 2 ? TEAL : CYN, 0.55);
      c.lineWidth = Math.max(1, scale);
      c.beginPath();
      c.arc(sx(o.x), sy(o.y), 8.4 * scale, 0, TAU);
      c.stroke();
    }
    if (G.form === 1 && G.options.length) {
      c.strokeStyle = rgba(GOLD, 0.18);
      c.lineWidth = Math.max(1, scale);
      c.beginPath();
      c.arc(sx(G.px), sy(G.py), (26 + G.options.length * 3.2) * scale, 0, TAU);
      c.stroke();
    }
    const x = G.px;
    const y = G.py;
    if (G.shield > 0) {
      const hexR = 16 + G.shield * 2;
      c.strokeStyle = rgba(TEAL, 0.55 + Math.sin(G.t * 6) * 0.2);
      c.lineWidth = Math.max(1.2, 1.6 * scale);
      c.beginPath();
      for (let k = 0; k < 6; k++) {
        const a = k * TAU / 6 + G.t * 0.4;
        const px = sx(x + Math.cos(a) * hexR);
        const py = sy(y + Math.sin(a) * hexR);
        if (k === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      c.closePath();
      c.stroke();
    }
    c.fillStyle = rgba(CYN, 0.22);
    c.beginPath();
    c.ellipse(sx(x - 8), sy(y), 16 * scale, 6 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(CYN, 0.95);
    c.beginPath();
    c.moveTo(sx(x + 14), sy(y));
    c.lineTo(sx(x - 8), sy(y - 8));
    c.lineTo(sx(x - 4), sy(y));
    c.lineTo(sx(x - 8), sy(y + 8));
    c.closePath();
    c.fill();
    c.fillStyle = rgba(WHT, 0.95);
    c.fillRect(sx(x - 2), sy(y - 3.2), 10 * scale, 6.4 * scale);
    c.fillStyle = '#031814';
    c.fillRect(sx(x + 1), sy(y - 1.6), 6 * scale, 3.2 * scale);
    c.fillStyle = rgba(TEAL, 0.9);
    c.beginPath();
    c.moveTo(sx(x - 6), sy(y - 3));
    c.lineTo(sx(x + 2), sy(y - 1));
    c.lineTo(sx(x - 6), sy(y + 3));
    c.closePath();
    c.fill();
    if (G.muzzle > 0) {
      c.fillStyle = rgba(WHT, G.muzzle / 0.06);
      c.beginPath();
      c.arc(sx(x + 16), sy(y), 5 * scale, 0, TAU);
      c.fill();
    }
  }

  function drawFx() {
    const c = ctx;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      c.fillStyle = rgba(p.rgb, clamp(p.life / p.max, 0, 1));
      c.fillRect(sx(p.x - p.r * 0.5), sy(p.y - p.r * 0.5), p.r * scale, p.r * scale);
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const t = s.t / 0.28;
      c.fillStyle = rgba(s.rgb, 1 - t);
      c.beginPath();
      c.arc(sx(s.x), sy(s.y), s.rad * (0.4 + t) * scale, 0, TAU);
      c.fill();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const t = r.t / 0.42;
      c.strokeStyle = rgba(r.rgb, 1 - t);
      c.lineWidth = Math.max(1, 2 * scale * (1 - t));
      c.beginPath();
      c.arc(sx(r.x), sy(r.y), (r.r + t * 28) * scale, 0, TAU);
      c.stroke();
    }
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      c.font = '700 ' + (f.size * scale) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
      c.fillStyle = rgba(f.rgb, a);
      c.fillText(f.text, sx(f.x), sy(f.y));
    }
  }

  function draw() {
    const c = ctx;
    if (!c) return;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = '#021410';
    c.fillRect(0, 0, W, H);

    c.save();
    let shx = 0;
    let shy = 0;
    if (G.shake > 0 && !REDUCE) {
      shx = (Math.random() - 0.5) * G.shake * scale;
      shy = (Math.random() - 0.5) * G.shake * 0.7 * scale;
    }
    const punch = REDUCE ? 1 : G.punch;
    c.translate(W * 0.5 + shx, H * 0.5 + shy);
    c.scale(punch, punch);
    c.translate(-W * 0.5, -H * 0.5);

    const g = c.createLinearGradient(sx(0), sy(0), sx(VW), sy(VH));
    g.addColorStop(0, '#041c18');
    g.addColorStop(0.45, '#032018');
    g.addColorStop(1, '#0a1814');
    c.fillStyle = g;
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    if (G.boss) {
      const core = findCore();
      if (core) {
        const pulse = 0.08 + Math.sin(G.t * 3.2) * 0.04;
        c.fillStyle = rgba(MAG, pulse);
        c.fillRect(sx(0), sy(0), VW * scale, VH * scale);
      }
    }

    drawMotes();
    drawFort();
    drawEnts();
    drawShots();
    drawPlayer();
    drawFx();

    if (G.flash > 0) {
      c.fillStyle = rgba(G.flashRgb, G.flash * 0.55);
      c.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
    c.restore();
  }

  function resize() {
    if (!canvas || !stageEl) return;
    const rect = stageEl.getBoundingClientRect();
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
    canvas.width = (W * dpr) | 0;
    canvas.height = (H * dpr) | 0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scale = Math.min(W / VW, H / VH);
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

  function resetRun(kind) {
    G.kind = kind || 'raid';
    G.t = 0;
    G.cam = 0;
    G.px = 88;
    G.py = VH * 0.5;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.stage = 1;
    G.cleared = 0;
    G.nextLife = LIFE_EVERY;
    G.ents.length = 0;
    G.shots.length = 0;
    G.eShots.length = 0;
    G.options.length = 0;
    G.trail.length = 0;
    G.speed = 0;
    G.ripple = false;
    G.twin = false;
    G.shield = 0;
    G.form = 0;
    G.spawnedX = 0;
    G.fireCd = 0;
    G.fireHold = false;
    G.deadT = 0;
    G.invuln = 0;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.muzzle = 0;
    G.toastT = 0;
    G.why = '';
    G.boss = false;
    G.winT = 0;
    G.engine = 0;
    G.beat = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    pointer.x = G.px;
    pointer.y = G.py;
    eid = 1;
  }

  function startGame(kind) {
    resetRun(kind || 'raid');
    G.mode = 'play';
    hideOverlay();
    audio.start();
    toast(isDense() ? '核腔' : '命力', false, true);
    trySpawn();
    syncHud();
    if (canvas && canvas.focus) canvas.focus();
  }

  function goTitle() {
    resetRun('raid');
    G.mode = 'title';
    showOverlay('title', '命力', TITLE_LEAD);
    if (btnOvRetry) btnOvRetry.textContent = '再穿';
    if (btnOvModes) btnOvModes.textContent = '换模式';
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('raid');
    else startGame(G.kind || 'raid');
  }

  function primaryAction() {
    audio.ensure();
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
    const zed = k === 'z' || k === 'Z' || code === 'KeyZ';

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

    if (down && (isMove || space || k === 'Enter' || shift || zed)) e.preventDefault();

    if (!down) {
      if (space) G.fireHold = false;
      return;
    }
    if (e.repeat && (k === 'r' || k === 'R' || shift || zed)) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
      return;
    }
    if (shift || zed) {
      audio.ensure();
      cycleForm();
      return;
    }
    if (k === '1' || (k === 'Enter' && G.mode === 'title')) {
      audio.ensure();
      startGame('raid');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      audio.ensure();
      startGame('core');
      return;
    }
    if (space) {
      audio.ensure();
      if (G.mode === 'title') startGame('raid');
      else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
      else {
        G.fireHold = true;
        fire();
      }
      return;
    }
    if (k === 'Enter') primaryAction();
  }

  function bind() {
    window.addEventListener('keydown', function (e) { onKey(e, true); });
    window.addEventListener('keyup', function (e) { onKey(e, false); });
    window.addEventListener('blur', function () {
      keys.l = keys.r = keys.u = keys.d = false;
      G.fireHold = false;
    });
    document.addEventListener('visibilitychange', function () {
      hidden = document.hidden;
      if (hidden) {
        keys.l = keys.r = keys.u = keys.d = false;
        G.fireHold = false;
      }
    });
    window.addEventListener('resize', resize);

    if (btnRaid) btnRaid.addEventListener('click', function () { audio.ensure(); startGame('raid'); });
    if (btnCore) btnCore.addEventListener('click', function () { audio.ensure(); startGame('core'); });
    if (btnOvRetry) btnOvRetry.addEventListener('click', function () { audio.ensure(); startGame(G.kind || 'raid'); });
    if (btnOvModes) {
      btnOvModes.addEventListener('click', function () {
        audio.ensure();
        if (G.mode === 'win' && !isDense()) startGame('core');
        else goTitle();
      });
    }
    if (btnMute) {
      btnMute.addEventListener('click', function () {
        audio.ensure();
        audio.setMuted(!audio.muted);
      });
    }
    if (btnRetry) btnRetry.addEventListener('click', function () { restart(); });
    if (btnOpt) btnOpt.addEventListener('click', function () { audio.ensure(); cycleForm(); });
    if (btnPad) btnPad.addEventListener('click', function () { audio.ensure(); cycleForm(); });

    canvas.addEventListener('pointerdown', function (e) {
      if (e.button === 2) {
        e.preventDefault();
        audio.ensure();
        cycleForm();
        return;
      }
      audio.ensure();
      if (G.mode === 'title') {
        startGame('raid');
        return;
      }
      if (G.mode === 'lose' || G.mode === 'win') return;
      pointer.down = true;
      pointer.hover = true;
      pointer.id = e.pointerId;
      pointer.x = pointerWorldX(e);
      pointer.y = pointerWorldY(e);
      inputSrc = 'ptr';
      G.fireHold = true;
      fire();
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      pointer.x = pointerWorldX(e);
      pointer.y = pointerWorldY(e);
      pointer.hover = true;
      if (pointer.down) inputSrc = 'ptr';
    });
    canvas.addEventListener('pointerup', function (e) {
      if (pointer.id === e.pointerId || pointer.id == null) {
        pointer.down = false;
        G.fireHold = false;
        pointer.id = null;
      }
    });
    canvas.addEventListener('pointercancel', function () {
      pointer.down = false;
      G.fireHold = false;
      pointer.id = null;
    });
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  let acc = 0;
  let last = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (!last) last = now;
    let dt = (now - last) / 1000;
    last = now;
    if (hidden) return;
    if (dt > 0.05) dt = 0.05;
    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 5) {
      step(STEP);
      acc -= STEP;
      steps += 1;
    }
    if (acc > STEP * 3) acc = 0;
    draw();
  }

  function init() {
    loadBest();
    audio.muted = loadMute();
    if (btnMute) {
      btnMute.textContent = audio.muted ? '静' : '声';
      btnMute.classList.toggle('muted', audio.muted);
    }
    seedMotes();
    resize();
    bind();
    goTitle();
    requestAnimationFrame(frame);
  }

  init();
})();
