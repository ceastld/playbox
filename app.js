(() => {
  const grid = document.getElementById("grid");
  const lobby = document.getElementById("lobby");
  const play = document.getElementById("play");
  const frame = document.getElementById("frame");
  const playTitle = document.getElementById("play-title");
  const playSub = document.getElementById("play-sub");
  const openTab = document.getElementById("open-tab");
  const countEl = document.getElementById("count");
  const empty = document.getElementById("empty");
  const q = document.getElementById("q");

  let games = [];

  function hash32(s) {
    let h = 2166136261;
    const str = String(s);
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function mulberry(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const MOTIFS = ["grid","waves","dots","rings","bars","maze","sparks","moons","thread","slash","vines","fold","hex","crystals"];
  const TAG_MOTIF = {
    接:"waves", 波:"waves", 漂:"waves", 涉:"waves", 潜:"waves", 滑:"waves",
    雾:"waves", 气:"waves", 斟:"waves", 脉:"waves", 帆:"waves",
    记:"maze", 径:"maze", 迷:"maze", 屑:"maze", 找:"maze", 躲:"maze", 隐:"maze", 巧:"maze",
    珠:"dots", 萤:"dots", 牧:"dots", 泡:"dots", 露:"dots", 骰:"dots", 沙:"dots", 灰:"dots",
    色:"dots", 墨:"dots", 投:"dots", 蛾:"dots",
    月:"moons", 影:"moons", 时:"moons",
    轮:"rings", 门:"rings", 钥:"rings", 印:"rings", 察:"rings", 传:"rings",
    转:"rings", 轨:"rings", 护:"rings", 磁:"rings", 塞:"rings", 旋:"rings",
    梳:"bars", 管:"bars", 织:"bars", 谱:"bars", 笛:"bars", 音:"bars",
    拍:"bars", 铃:"bars", 听:"bars", 律:"bars", 稳:"bars", 衡:"bars",
    停:"bars", 倒:"bars", 跳:"bars", 踏:"grid",
    火:"sparks", 汽:"sparks", 光:"sparks", 电:"sparks", 灯:"sparks",
    板:"grid", 叠:"grid", 修:"grid",
    绳:"thread", 绕:"thread", 纱:"thread", 鸢:"thread", 收:"thread",
    剪:"slash", 切:"slash", 撕:"slash", 凿:"slash", 速:"slash", 射:"slash",
    苔:"vines", 藤:"vines", 养:"vines", 圈:"vines", 栖:"vines", 引:"vines", 爬:"vines",
    折:"fold", 形:"fold", 合:"hex", 霜:"crystals", 弹:"rings", 推:"bars"
  };

  function motifOf(tag, seed) {
    return TAG_MOTIF[tag] || MOTIFS[seed % MOTIFS.length];
  }

  function hsl(h, s, l, a) {
    return a == null ? `hsl(${h} ${s}% ${l}%)` : `hsla(${h} ${s}% ${l}% / ${a})`;
  }

  function paintThumb(canvas, g) {
    const W = 320, H = 180;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const hue = Number(g.hue);
    const h = Number.isFinite(hue) ? hue : 300;
    const seed = hash32((g.id || "") + "|" + (g.tag || "") + "|" + h);
    const rnd = mulberry(seed);
    const motif = motifOf(g.tag, seed);

    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, hsl(h, 42, 9));
    bg.addColorStop(1, hsl((h + 24) % 360, 38, 14));
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const blob = ctx.createRadialGradient(40 + rnd() * 240, 20 + rnd() * 140, 8, 160, 90, 180);
    blob.addColorStop(0, hsl(h, 90, 58, 0.22));
    blob.addColorStop(1, hsl(h, 80, 40, 0));
    ctx.fillStyle = blob;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    drawMotif(ctx, motif, W, H, h, rnd);
    ctx.restore();

    const tag = g.tag || "";
    if (tag) {
      ctx.save();
      ctx.font = "700 54px 'PingFang SC','Noto Sans SC',sans-serif";
      ctx.fillStyle = hsl(h, 80, 78, 0.12);
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(tag, 16, H - 14);
      ctx.restore();
    }

    const fade = ctx.createLinearGradient(0, H - 28, 0, H);
    fade.addColorStop(0, hsl(h, 30, 8, 0));
    fade.addColorStop(1, hsl(h, 30, 8, 0.35));
    ctx.fillStyle = fade;
    ctx.fillRect(0, H - 28, W, 28);
  }

  function drawMotif(ctx, motif, W, H, h, rnd) {
    const ink = hsl(h, 88, 68, 0.85);
    const dim = hsl(h, 70, 62, 0.35);
    const bright = hsl((h + 18) % 360, 95, 76, 0.9);
    ctx.strokeStyle = ink;
    ctx.fillStyle = bright;
    ctx.lineWidth = 1.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (motif === "waves") {
      for (let i = 0; i < 5; i++) {
        const y0 = 28 + i * 28 + rnd() * 8;
        const amp = 6 + rnd() * 14;
        const per = 40 + rnd() * 50;
        const ph = rnd() * Math.PI * 2;
        ctx.beginPath();
        for (let x = -4; x <= W + 4; x += 4) {
          const y = y0 + Math.sin(x / per + ph) * amp;
          if (x < 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = hsl(h, 80, 70, 0.35 + i * 0.1);
        ctx.lineWidth = 1.2 + i * 0.15;
        ctx.stroke();
      }
      return;
    }

    if (motif === "dots") {
      const n = 18 + (hash32(String(rnd())) % 14);
      for (let i = 0; i < n; i++) {
        const x = 12 + rnd() * (W - 24);
        const y = 12 + rnd() * (H - 24);
        const r = 1.6 + rnd() * 5.5;
        ctx.beginPath();
        ctx.fillStyle = hsl(h, 85, 70, 0.25 + rnd() * 0.6);
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }

    if (motif === "rings") {
      const cx = 70 + rnd() * 180, cy = 40 + rnd() * 100;
      for (let i = 1; i <= 5; i++) {
        ctx.beginPath();
        ctx.strokeStyle = hsl(h, 80, 70, 0.55 - i * 0.07);
        ctx.lineWidth = 1.2;
        ctx.arc(cx, cy, 10 + i * (12 + rnd() * 6), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.strokeStyle = dim;
      ctx.arc(cx + 70 + rnd() * 40, cy + 10, 18 + rnd() * 16, 0, Math.PI * 2);
      ctx.stroke();
      return;
    }

    if (motif === "bars") {
      const n = 9 + Math.floor(rnd() * 5);
      const gap = W / (n + 1);
      for (let i = 0; i < n; i++) {
        const bh = 20 + rnd() * 110;
        const x = gap * (i + 0.55);
        ctx.fillStyle = hsl(h, 80, 68, 0.25 + rnd() * 0.55);
        ctx.fillRect(x, H - 16 - bh, 7 + rnd() * 5, bh);
      }
      return;
    }

    if (motif === "grid") {
      ctx.strokeStyle = hsl(h, 60, 70, 0.22);
      ctx.lineWidth = 1;
      const step = 16 + Math.floor(rnd() * 10);
      for (let x = 8; x < W; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 8; y < H; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
      const cells = 4 + Math.floor(rnd() * 5);
      for (let i = 0; i < cells; i++) {
        const cx = Math.floor(rnd() * 12) * step + 8;
        const cy = Math.floor(rnd() * 6) * step + 8;
        ctx.fillStyle = hsl(h, 90, 66, 0.28 + rnd() * 0.4);
        ctx.fillRect(cx + 1, cy + 1, step - 2, step - 2);
      }
      return;
    }

    if (motif === "maze") {
      const cols = 8, rows = 4, cw = W / cols, rh = H / rows;
      ctx.strokeStyle = hsl(h, 75, 70, 0.55);
      ctx.lineWidth = 2;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const x0 = x * cw, y0 = y * rh;
          if (rnd() > 0.45) { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + cw, y0); ctx.stroke(); }
          if (rnd() > 0.45) { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 + rh); ctx.stroke(); }
        }
      }
      ctx.strokeRect(6, 6, W - 12, H - 12);
      return;
    }

    if (motif === "sparks") {
      const n = 7 + Math.floor(rnd() * 5);
      for (let i = 0; i < n; i++) {
        const x = 20 + rnd() * (W - 40);
        const y = 16 + rnd() * (H - 32);
        const rays = 5 + Math.floor(rnd() * 5);
        ctx.strokeStyle = hsl(h, 95, 72, 0.7);
        ctx.lineWidth = 1.1;
        for (let r = 0; r < rays; r++) {
          const a = (r / rays) * Math.PI * 2 + rnd();
          const len = 8 + rnd() * 22;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.fillStyle = hsl(h, 100, 80, 0.9);
        ctx.arc(x, y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }

    if (motif === "moons") {
      const drawMoon = (x, y, r, phase) => {
        ctx.beginPath();
        ctx.fillStyle = hsl(h, 70, 78, 0.85);
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        ctx.arc(x + phase * r, y - phase * 0.2 * r, r * 0.86, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
      };
      drawMoon(70 + rnd() * 40, 70 + rnd() * 20, 36 + rnd() * 10, 0.35 + rnd() * 0.45);
      drawMoon(210 + rnd() * 50, 40 + rnd() * 80, 10 + rnd() * 10, 0.2 + rnd() * 0.5);
      drawMoon(160 + rnd() * 80, 130, 7 + rnd() * 6, 0.4);
      return;
    }

    if (motif === "thread") {
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.strokeStyle = hsl(h, 80, 70, 0.4 + rnd() * 0.4);
        ctx.lineWidth = 1.1 + rnd() * 1.4;
        ctx.moveTo(rnd() * W, rnd() * H);
        ctx.bezierCurveTo(rnd() * W, rnd() * H, rnd() * W, rnd() * H, rnd() * W, rnd() * H);
        ctx.stroke();
      }
      return;
    }

    if (motif === "slash") {
      for (let i = 0; i < 8; i++) {
        const x = rnd() * W;
        ctx.beginPath();
        ctx.strokeStyle = hsl(h, 85, 70, 0.3 + rnd() * 0.5);
        ctx.lineWidth = 1 + rnd() * 3;
        ctx.moveTo(x, -10);
        ctx.lineTo(x - 40 - rnd() * 80, H + 10);
        ctx.stroke();
      }
      return;
    }

    if (motif === "vines") {
      for (let i = 0; i < 4; i++) {
        let x = 30 + rnd() * (W - 60), y = H;
        ctx.beginPath();
        ctx.strokeStyle = hsl(h, 70, 60, 0.7);
        ctx.lineWidth = 1.6;
        ctx.moveTo(x, y);
        for (let k = 0; k < 6; k++) {
          x += (rnd() - 0.5) * 50;
          y -= 18 + rnd() * 16;
          ctx.lineTo(x, y);
          ctx.moveTo(x, y);
          ctx.lineTo(x + (rnd() > 0.5 ? 12 : -12), y + 6);
          ctx.moveTo(x, y);
        }
        ctx.stroke();
      }
      return;
    }

    if (motif === "fold") {
      ctx.strokeStyle = hsl(h, 70, 75, 0.55);
      ctx.fillStyle = hsl(h, 80, 70, 0.18);
      for (let i = 0; i < 5; i++) {
        const x = 20 + rnd() * (W - 80);
        const y = 10 + rnd() * (H - 70);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 40 + rnd() * 50, y + rnd() * 20);
        ctx.lineTo(x + 10 + rnd() * 30, y + 40 + rnd() * 30);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      return;
    }

    if (motif === "hex") {
      const r = 16 + rnd() * 6;
      ctx.strokeStyle = hsl(h, 70, 70, 0.45);
      ctx.lineWidth = 1.1;
      const hex = (cx, cy) => {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = Math.PI / 3 * i + Math.PI / 6;
          const px = cx + r * Math.cos(a), py = cy + r * Math.sin(a);
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      };
      const dx = r * 1.75, dy = r * 1.52;
      for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 8; col++) {
          hex(col * dx + (row % 2 ? dx / 2 : 0) - 10, row * dy);
        }
      }
      const hx = 2 + Math.floor(rnd() * 5), hy = 1 + Math.floor(rnd() * 3);
      ctx.fillStyle = hsl(h, 90, 66, 0.35);
      ctx.beginPath();
      const cx = hx * dx, cy = hy * dy;
      for (let i = 0; i < 6; i++) {
        const a = Math.PI / 3 * i + Math.PI / 6;
        const px = cx + r * Math.cos(a), py = cy + r * Math.sin(a);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      return;
    }

    if (motif === "crystals") {
      const grow = (x, y, a, depth) => {
        if (depth <= 0) return;
        const len = 8 + rnd() * 16;
        const x2 = x + Math.cos(a) * len;
        const y2 = y + Math.sin(a) * len;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = hsl(h, 80, 78, 0.25 + depth * 0.12);
        ctx.stroke();
        grow(x2, y2, a - 0.5 - rnd() * 0.3, depth - 1);
        grow(x2, y2, a + 0.5 + rnd() * 0.3, depth - 1);
      };
      ctx.lineWidth = 1.1;
      grow(W * 0.5, H * 0.75, -Math.PI / 2, 5);
      grow(W * 0.25, H * 0.85, -Math.PI / 2 - 0.3, 4);
      grow(W * 0.75, H * 0.8, -Math.PI / 2 + 0.3, 4);
      return;
    }

    for (let i = 0; i < 12; i++) {
      ctx.beginPath();
      ctx.fillStyle = hsl(h, 80, 70, 0.35);
      ctx.arc(rnd() * W, rnd() * H, 2 + rnd() * 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function attachThumb(el, g) {
    const canvas = document.createElement("canvas");
    canvas.className = "thumb";
    canvas.setAttribute("aria-hidden", "true");
    paintThumb(canvas, g);
    el.appendChild(canvas);

    const base = g.url || g.dir || ("g/" + g.id + "/");
    const tryImg = (src, fallback) => {
      const img = new Image();
      img.className = "thumb";
      img.alt = "";
      img.decoding = "async";
      img.onload = () => canvas.replaceWith(img);
      img.onerror = fallback || (() => {});
      img.src = src;
    };
    tryImg(base + "preview.svg", () => tryImg(base + "preview.png"));
  }

  function card(g, i) {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "card";
    el.style.setProperty("--h", String(g.hue ?? 300));
    attachThumb(el, g);
    const n = String(i + 1).padStart(2, "0");
    const meta = document.createElement("span");
    meta.className = "idx";
    meta.textContent = n;
    el.appendChild(meta);
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = g.tag || "游戏";
    el.appendChild(badge);
    const h2 = document.createElement("h2");
    h2.textContent = g.title;
    el.appendChild(h2);
    const sub = document.createElement("p");
    sub.className = "sub";
    sub.textContent = g.subtitle || "";
    el.appendChild(sub);
    const blurb = document.createElement("p");
    blurb.className = "blurb";
    blurb.textContent = g.blurb || "";
    el.appendChild(blurb);
    el.addEventListener("click", () => openGame(g));
    return el;
  }

  function hay(g) {
    return [g.title, g.subtitle, g.tag, g.blurb].join(" ").toLowerCase();
  }

  function render() {
    const needle = (q.value || "").trim().toLowerCase();
    grid.innerHTML = "";
    let shown = 0;
    games.forEach((g, i) => {
      if (needle && !hay(g).includes(needle)) return;
      grid.appendChild(card(g, i));
      shown++;
    });
    const noMatch = needle && shown === 0 && games.length > 0;
    empty.classList.toggle("hidden", !noMatch);
    if (!games.length && !needle) {
      empty.classList.add("hidden");
      grid.textContent = "还没有过关的游戏。第一批写完会挂到这里。";
    }
  }

  function hrefOf(g) {
    if (g.url) return g.url;
    if (g.dir) return g.dir.startsWith(".") ? g.dir : "./" + g.dir;
    return "./g/" + g.id + "/";
  }

  function openGame(g) {
    playTitle.textContent = g.title;
    playSub.textContent = g.subtitle || "";
    const src = hrefOf(g);
    openTab.href = src;
    frame.src = src;
    lobby.classList.add("hidden");
    play.classList.remove("hidden");
    history.replaceState({ play: g.id }, "", "#/" + g.id);
  }

  function closeGame() {
    frame.src = "about:blank";
    play.classList.add("hidden");
    lobby.classList.remove("hidden");
    history.replaceState({}, "", "./");
  }

  document.getElementById("back").onclick = closeGame;
  q.addEventListener("input", render);
  q.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      q.value = "";
      render();
    }
  });

  function route() {
    const id = location.hash.replace(/^#\/?/, "");
    const g = games.find((x) => x.id === id);
    if (g) openGame(g);
    else if (!play.classList.contains("hidden")) closeGame();
  }
  window.addEventListener("hashchange", route);

  fetch("./catalog.json?t=" + Date.now())
    .then((r) => r.json())
    .then((list) => {
      games = Array.isArray(list) ? list : [];
      countEl.textContent = games.length + " 戏";
      render();
      route();
    })
    .catch(() => {
      grid.textContent = "目录加载失败。确认 catalog.json 和本页在一起发布。";
    });
})();
