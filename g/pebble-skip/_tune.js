'use strict';

const WORLD_W = 960;
const WORLD_H = 540;
const WATER_Y = 364;
const BANK_Y = 356;
const NEAR_X = 164;
const TX = 114;
const TY = 316;
const R = 6.5;
const GRAV = 520;
const MIN_SPD = 300;
const MAX_SPD = 740;
const SKIP_ANG = 0.5;
const MIN_SKIP = 160;
const DT = 1 / 120;
const BOUNCE_CAP = 128;

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function hypot(x, y) { return Math.sqrt(x * x + y * y); }

function waterY(x, t, wave) {
  if (!wave) return WATER_Y;
  return WATER_Y + wave.amp * Math.sin(x * wave.k + t * wave.w);
}

function logX(log, t) {
  const u = (Math.sin(t * log.spd + log.phase) + 1) * 0.5;
  return log.a + (log.b - log.a) * u;
}

function sim(angle, power, stage, t0) {
  const spd = MIN_SPD + clamp(power, 0, 1) * (MAX_SPD - MIN_SPD);
  let x = TX + 18;
  let y = TY;
  let vx = Math.cos(angle) * spd;
  let vy = Math.sin(angle) * spd;
  let skips = 0;
  let t = t0 || 0;
  const landX = stage.landX;
  const padW = stage.padW;
  const wind = stage.wind || 0;
  const wave = stage.wave;
  const rocks = stage.rocks || [];
  const logs = stage.logs || [];
  const minSkip = stage.minSkip || 0;
  let airborne = 0;
  const skipX = [];
  for (let i = 0; i < 3000; i++) {
    vy += GRAV * DT;
    vx += wind * DT;
    x += vx * DT;
    y += vy * DT;
    t += DT;
    airborne += DT;

    if (x < -30 || x > WORLD_W + 50 || y > WORLD_H + 30 || y < -90) {
      return { result: 'out', skips, x: x | 0, skipX };
    }

    if (x + R >= landX && x - R <= landX + padW && y + R >= BANK_Y && vy >= -10) {
      const landAng = Math.atan2(Math.max(0, vy), Math.max(30, Math.abs(vx)));
      if (landAng > 0.85) return { result: 'steep', skips, x: x | 0, skipX };
      if (skips < minSkip) return { result: 'few', skips, x: x | 0, skipX };
      return { result: 'land', skips, x: x | 0, t, skipX };
    }

    for (let k = 0; k < rocks.length; k++) {
      const rk = rocks[k];
      const ry = WATER_Y - rk.r * 0.28;
      if (hypot(x - rk.x, y - ry) < R + rk.r * 0.8) {
        return { result: 'rock', skips, x: x | 0, skipX };
      }
    }
    for (let k = 0; k < logs.length; k++) {
      const lg = logs[k];
      const lx = logX(lg, t);
      const ly = waterY(lx, t, wave) - 3;
      if (x > lx - lg.w / 2 - R && x < lx + lg.w / 2 + R && y > ly - lg.h - R && y < ly + 7) {
        return { result: 'log', skips, x: x | 0, skipX };
      }
    }

    const overWater = (x > NEAR_X + 8 && x < landX) || (x > landX + padW + 1);
    if (overWater && airborne > 0.03) {
      const wy = waterY(x, t, wave);
      if (y + R >= wy && vy > 0) {
        const spdNow = hypot(vx, vy);
        let impact = Math.atan2(vy, Math.max(40, Math.abs(vx)));
        if (wave) {
          const slope = wave.amp * wave.k * Math.cos(x * wave.k + t * wave.w);
          impact += Math.atan(slope) * 0.5;
        }
        if (impact < SKIP_ANG && spdNow > MIN_SKIP && vx > 32) {
          const q = clamp(1 - impact / SKIP_ANG, 0, 1);
          let bounce = Math.abs(vy) * (0.4 + 0.28 * q) + 24 + 34 * q;
          bounce = Math.min(BOUNCE_CAP, bounce);
          vy = -bounce;
          vx *= 0.87 + 0.08 * q;
          y = wy - R - 1;
          skips++;
          skipX.push(x | 0);
          airborne = 0;
          if (skips > 14) return { result: 'sink', skips, x: x | 0, skipX };
        } else {
          return { result: 'sink', skips, x: x | 0, skipX };
        }
      }
    }
  }
  return { result: 'timeout', skips, x: x | 0, skipX };
}

function search(stage, name) {
  const hits = [];
  const fails = {};
  const timed = !!(stage.logs || stage.wave);
  for (let a = -0.22; a <= 0.18; a += 0.02) {
    for (let p = 0.22; p <= 1.001; p += 0.04) {
      const tmax = timed ? 3.6 : 0;
      const tstep = timed ? 0.4 : 1;
      for (let t0 = 0; t0 <= tmax; t0 += tstep) {
        const r = sim(a, p, stage, t0);
        if (r.result === 'land') {
          hits.push({ a: +a.toFixed(3), p: +p.toFixed(3), t0: +t0.toFixed(1), skips: r.skips, skipX: r.skipX, x: r.x });
          break;
        }
        fails[r.result] = (fails[r.result] || 0) + 1;
        if (!timed) break;
      }
    }
  }
  const mid = hits.filter(h => h.p >= 0.36 && h.p <= 0.72 && h.a >= -0.14 && h.a <= 0.08);
  console.log('\n== ' + name + ' land=' + stage.landX + '+' + stage.padW + ' min=' + (stage.minSkip || 0) + ' hits=' + hits.length + ' mid=' + mid.length);
  console.log('  fails', fails);
  if (hits.length) {
    const s = hits.map(h => h.skips);
    console.log('  skip', Math.min.apply(null, s), '-', Math.max.apply(null, s));
    console.log('  e.g.', mid[0] || hits[(hits.length / 2) | 0]);
  }
}

const stages = [
  { name: '浅湾', landX: 430, padW: 280, minSkip: 1 },
  { name: '连跳', landX: 560, padW: 230, minSkip: 2 },
  { name: '窄矶', landX: 610, padW: 100, minSkip: 2 },
  { name: '逆风', landX: 555, padW: 200, wind: -60, minSkip: 2 },
  { name: '石障', landX: 640, padW: 175, minSkip: 2, rocks: [{ x: 405, r: 14 }] },
  { name: '浪脊', landX: 620, padW: 165, minSkip: 2, wave: { amp: 12, k: 0.014, w: 1.4 } },
  { name: '漂木', landX: 660, padW: 155, minSkip: 2, logs: [{ a: 400, b: 560, w: 50, h: 10, spd: 0.5, phase: 0.8 }] },
  { name: '双石', landX: 690, padW: 140, minSkip: 2, rocks: [{ x: 340, r: 12 }, { x: 530, r: 13 }] },
  { name: '逆潮', landX: 670, padW: 96, minSkip: 2, wind: -40, wave: { amp: 10, k: 0.013, w: 1.5 }, rocks: [{ x: 450, r: 13 }] },
  { name: '远岸', landX: 735, padW: 115, minSkip: 3, wind: -20, rocks: [{ x: 370, r: 12 }] }
];

console.log('defaults');
[[-0.06, 0.46], [-0.1, 0.52], [0.02, 0.5], [-0.04, 0.58], [0.06, 0.42]].forEach(function (ap) {
  const r = sim(ap[0], ap[1], stages[0], 0);
  console.log(ap, r.result, 'skips', r.skips, 'x', r.x, r.skipX);
});

stages.forEach(s => search(s, s.name));
console.log('\ndefault on stage1', sim(-0.06, 0.48, stages[0], 0));
