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
  const filtersEl = document.getElementById("filters");
  const subsEl = document.getElementById("subs");
  const shelfHead = document.getElementById("shelf-head");
  const moreEl = document.getElementById("more");

  let games = [];
  let filter = "picks";
  const PICKS = ["tan-tang", "twenty48", "mirror-step", "echo-ping", "melt-core", "tide-trace", "ghost-jump", "beat-blade", "pebble-skip", "fold-crane", "dice-lock", "night-gate", "fuse-cut", "yarn-ball"];
  const FAMILIES = [
    { id: "picks", title: "精选", hint: "从这儿开始，这几款最好上手" },
    { id: "remake", title: "复刻", hint: "同类挤在一起，再按小类翻", kind: "remake" },
    { id: "pulse", title: "节奏", tags: "拍铃听律音笛谱" },
    { id: "water", title: "水面", tags: "接波漂涉潜滑雾气斟帆露" },
    { id: "mind", title: "巧思", tags: "记径迷屑找躲隐巧察印钥门月影时骰" },
    { id: "move", title: "动作", tags: "跳踏剪切撕凿速射转投推弹" },
    { id: "grow", title: "养成", tags: "苔藤养圈栖引爬牧" },
    { id: "all", title: "全部", hint: "按类型成组，同类挨着" }
  ];
  function familyOf(g) {
    if (g.kind === "remake" || g.pack === "classic") return "remake";
    const tag = g.tag || "";
    for (const f of FAMILIES) { if (f.tags && f.tags.includes(tag)) return f.id; }
    return "all";
  }

  const PACK_OF = {"tan-tang":"board","castlevania3":"side","after-burner2":"shoot","alien-soldier":"side","r-type-delta":"shoot","metalslug4":"side","twenty48":"board","snake":"board","minesweeper":"board","tetris":"board","five48":"board","snake-gate":"board","brick-out":"board","hex-mines":"board","tetra-40":"board","soko-box":"board","wall-pong":"board","rev-disc":"board","fruit-cut":"board","stack-crash":"board","pin-ball":"board","star-raid":"shoot","chain-boom":"board","frog-hop":"shoot","horde-bite":"shoot","gem-three":"board","air-puck":"board","beat-tap":"board","bubble-shot":"shoot","rock-spin":"shoot","dunk-rim":"board","centi-crawl":"shoot","miss-cmd":"shoot","qix-cut":"board","dot-munch":"shoot","kaboom-catch":"board","kong-climb":"side","joust-kick":"shoot","ski-slide":"shoot","tempest-tube":"shoot","pipe-flow":"board","bomb-maze":"side","moon-run":"shoot","lode-dig":"side","cube-hop":"board","ice-peak":"board","river-raid":"shoot","tapper-pour":"board","scram-run":"shoot","berzerk-run":"side","time-loop":"shoot","defend-line":"shoot","lift-gun":"side","burger-stack":"board","paper-toss":"board","gaunt-hall":"side","out-run":"race","xenon-run":"shoot","pole-dash":"race","sky-1942":"shoot","crystal-run":"side","track-dash":"shoot","zax-iso":"shoot","punch-bag":"fight","space-rush":"shoot","ikari-run":"side","after-burn":"shoot","marble-mad":"board","r-type-run":"shoot","hang-on":"race","gradius-run":"shoot","shinobi-run":"side","spy-hunt":"race","contra-run":"side","wonder-isle":"side","dual-cut":"brawl","beast-run":"side","rage-street":"brawl","castle-whip":"side","mega-run":"side","axe-war":"brawl","ghost-run":"side","slug-run":"side","rain-isle":"side","gal-raid":"shoot","kung-leap":"brawl","bubble-twin":"shoot","invader":"shoot","twin-bee":"shoot","duck-hunt":"shoot","street-fist":"fight","xevi-run":"shoot","phoenix":"shoot","puzzle-pop":"board","fantasy-sky":"shoot","wolf-gun":"shoot","green-raid":"side","star-force":"shoot","alex-leap":"side","pac-land":"side","sea-1943":"shoot","pooyan":"shoot","mr-do":"board","pengo-push":"board","balloon-kid":"shoot","ninja-gaid":"side","bomb-jack":"board","circus-jump":"board","rally-x":"shoot","jungle-king":"side","kangaroo":"side","gyruss":"shoot","robotron":"shoot","chackn-pop":"shoot","sinistar":"shoot","juno-first":"shoot","mappy":"side","wizard-wor":"side","elevator-act":"side","carnival":"shoot","congo-bongo":"shoot","gorf":"shoot","food-fight":"board","qbert":"board","zookeeper":"shoot","crazy-climb":"side","alibaba":"side","bosconian":"shoot","ikaruga":"shoot","super-sprint":"race","skate-720":"race","millipede":"shoot","asteroids":"shoot","battlezone":"shoot","tron-cycle":"shoot","outrun":"race","star-castle":"shoot","warlords":"shoot","lunar-land":"board","major-havoc":"shoot","cloak-dagger":"side","gaplus":"shoot","star-trench":"shoot","gravitar":"shoot","space-fury":"shoot","omega-race":"race","red-baron":"shoot","black-widow":"shoot","star-fire":"shoot","xenophobe":"side","blasteroids":"shoot","vanguard":"shoot","astro-blaster":"shoot","rampage":"brawl","raiden":"shoot","gun-smoke":"shoot","rygar":"side","choplifter":"shoot","flying-shark":"shoot","tmnt":"brawl","twin-cobra":"shoot","ice-climber":"side","venture":"side","x-men":"brawl","cadillacs":"brawl","blazing-star":"shoot","punisher":"brawl","captain-commando":"brawl","knights-round":"brawl","p-47":"shoot","willow":"shoot","simpsons":"brawl","sunset-riders":"brawl","strider":"side","section-z":"shoot","magic-sword":"shoot","ghosts-goblins":"side","aliens":"shoot","cabal":"shoot","capcom-1941":"shoot","snow-bros":"board","pang":"board","forgotten-worlds":"shoot","excitebike":"race","bionic":"side","splatterhouse":"side","ninja-spirit":"side","toki":"side","kiwi":"side","cyber-nator":"shoot","netherworld":"shoot","twin-hawk":"shoot","rolling-thunder":"side","gunstar":"side","silkworm":"shoot","axelay":"shoot","darius":"shoot","viewtiful":"brawl","super-contra":"side","chase-hq":"race","space-harrier":"shoot","psycho-soldier":"shoot","salamander2":"shoot","zaxxon":"shoot","gauntlet":"side","donpachi":"shoot","gunbird":"shoot","power-drift":"race","aleste":"shoot","cotton":"shoot","baraduke":"shoot","r-type2":"shoot","batsugun":"shoot","dogyuun":"shoot","truxton":"shoot","progear":"shoot","esprade":"shoot","guwange":"shoot","ketsui":"shoot","mushihimesama":"shoot","dimahoo":"shoot","mars-matrix":"shoot","giga-wing":"shoot","ibara":"shoot","battle-garegga":"shoot","varth":"shoot","armed-police":"shoot","dangun-feveron":"shoot","pink-sweets":"shoot","outrun2":"race","deathsmiles":"shoot","sengoku-ace":"shoot","shikigami":"shoot","metal-black":"shoot","pulstar":"shoot","last-resort":"shoot","striker-1945":"shoot","sonic-wings":"shoot","samurai-aki":"shoot","gunnail":"shoot","gunbarich":"shoot","parodius":"shoot","bio-metal":"shoot","dragon-spirit":"shoot","image-fight":"shoot","super-star":"shoot","terra-crest":"shoot","cybattler":"shoot","macross":"shoot","star-fox":"shoot","gyrodine":"shoot","blast-off":"shoot","daioh":"shoot","phelios":"shoot","twinkle-star":"fight","vfive":"shoot","gunhed":"shoot","dragoon":"shoot","p47":"shoot","plus-alpha":"shoot","warblade":"shoot","stardust":"shoot","liekong":"shoot","nuke-raid":"shoot","sky-ace":"shoot","blade-storm":"shoot","nexa":"shoot","outzone":"shoot","zerowing":"shoot","hellfire":"shoot","sonic-boom":"shoot","vipers":"shoot","flash-gal":"shoot","gunforce":"side","prehistoric-isle":"shoot","nastro":"shoot","galactic":"shoot","raystorm":"shoot","dragon-blaze":"shoot","xexex":"shoot","layered":"shoot","soukyugurentai":"shoot","thunder-force-iii":"shoot","gungage":"shoot","night-striker":"shoot","last-blade":"fight","thunder-cross":"shoot","ajax":"shoot","thunder-fox":"side","mercs":"shoot","time-pilot":"shoot","in-the-hunt":"shoot","flak-attack":"shoot","scramble":"shoot","samurai-spirits":"fight","jackal":"shoot","life-force":"shoot","nemesis":"shoot","jigoku-meguri":"shoot","rush-n-attack":"side","iron-tank":"shoot","fatal-fury":"fight","king-of-fighters":"fight","terra-force":"shoot","devastators":"shoot","n1942":"shoot","rapier":"shoot","super-cobra":"shoot","defender":"shoot","spy-hunter":"shoot","joust":"fight","art-of-fighting":"fight","cosmo-gang":"shoot","sky-kid":"shoot","galaga88":"shoot","toobin":"board","windjammers":"board","after-burner":"shoot","tempest":"shoot","space-invaders":"shoot","missile-command":"shoot","stargate":"shoot","galaxian":"shoot","xevious":"shoot","n1941":"shoot","raiden2":"shoot","thunder-force4":"shoot","do-don-pachi":"shoot","star-wars":"shoot","n1944":"shoot","super-hang-on":"race","radiant-silvergun":"shoot","gradius2":"shoot","r-type-leo":"shoot","ghouls-n-ghosts":"side","daytona":"race","outrunners":"race","shinobi2":"side","thunder-force2":"shoot","streets-of-rage2":"brawl","wonder-boy":"side","virtua-racing":"race","contra2":"side","castlevania":"side","ninja-gaiden2":"side","ghosts-n-goblins":"side","golden-axe2":"brawl","bubble-bobble":"shoot","shinobi3":"side","streets-of-rage3":"brawl","contra3":"side","r-type3":"shoot","darius2":"shoot","gradius3":"shoot","double-dragon2":"brawl","kung-fu2":"brawl","metalslug2":"side","final-fight2":"brawl","metalslug3":"side","streets-of-rage4":"brawl","castlevania2":"side","shinobi4":"side","alex-kidd":"side","thunder-force3":"shoot","ninja-gaiden3":"side","golden-axe3":"brawl","double-dragon3":"brawl","wonder-boy3":"side"};
  const SERIES_ALIAS = {"castlevania3":"castlevania","after-burner2":"after-burner","r-type-delta":"r-type","metalslug4":"metalslug","contra4":"contra","darius-gaiden":"darius","fatal-fury2":"fatal-fury","space-harrier2":"space-harrier","bubble-symphony":"bubble-bobble","r-type-run":"r-type","r-type-leo":"r-type","r-type2":"r-type","r-type3":"r-type","r-type-delta":"r-type","gradius-run":"gradius","gradius2":"gradius","gradius3":"gradius","life-force":"gradius","nemesis":"gradius","thunder-force-iii":"thunder-force","thunder-force2":"thunder-force","thunder-force3":"thunder-force","thunder-force4":"thunder-force","after-burn":"after-burner","after-burner2":"after-burner","out-run":"outrun","outrun2":"outrun","outrunners":"outrun","ninja-gaid":"ninja-gaiden","ninja-gaiden2":"ninja-gaiden","ninja-gaiden3":"ninja-gaiden","shinobi-run":"shinobi","shinobi2":"shinobi","shinobi3":"shinobi","shinobi4":"shinobi","ghost-run":"ghosts","ghosts-goblins":"ghosts","ghosts-n-goblins":"ghosts","ghouls-n-ghosts":"ghosts","wonder-isle":"wonder-boy","wonder-boy3":"wonder-boy","alex-leap":"alex-kidd","contra-run":"contra","super-contra":"contra","contra2":"contra","contra3":"contra","slug-run":"metalslug","metalslug2":"metalslug","metalslug3":"metalslug","metalslug4":"metalslug","rage-street":"streets-of-rage","streets-of-rage2":"streets-of-rage","streets-of-rage3":"streets-of-rage","streets-of-rage4":"streets-of-rage","dual-cut":"double-dragon","double-dragon2":"double-dragon","double-dragon3":"double-dragon","kung-leap":"kung-fu","kung-fu2":"kung-fu","castle-whip":"castlevania","castlevania2":"castlevania","castlevania3":"castlevania","axe-war":"golden-axe","golden-axe2":"golden-axe","golden-axe3":"golden-axe","bubble-twin":"bubble-bobble","bubble-bobble":"bubble-bobble","sky-1942":"194x","n1941":"194x","n1942":"194x","n1944":"194x","capcom-1941":"194x","sea-1943":"194x","striker-1945":"194x","raiden":"raiden","raiden2":"raiden","donpachi":"donpachi","do-don-pachi":"donpachi","hang-on":"hang-on","super-hang-on":"hang-on","invader":"space-invaders","space-invaders":"space-invaders","miss-cmd":"missile-command","missile-command":"missile-command","gal-raid":"galaxian","galaxian":"galaxian","galaga88":"galaxian","gaplus":"galaxian","xevi-run":"xevious","xevious":"xevious","darius":"darius","darius2":"darius","final-fight2":"final-fight","outrun":"outrun"};

  const PACKS = [
    { id: "shoot", title: "射击", hint: "弹幕、纵版、横弹" },
    { id: "side", title: "横版", hint: "跑跳斩、魂斗金弹" },
    { id: "brawl", title: "清版", hint: "街上连打" },
    { id: "fight", title: "对战", hint: "出招对打" },
    { id: "race", title: "竞速", hint: "甩尾过弯" },
    { id: "board", title: "巧盘", hint: "消、合、推、翻" }
  ];
  let sub = "all";

  function packOf(g) {
    if (PACK_OF[g.id]) return PACK_OF[g.id];
    return familyOf(g);
  }

  function seriesKey(g) {
    const id = g.id || "";
    if (SERIES_ALIAS[id]) return SERIES_ALIAS[id];
    return id.replace(/-iii$/, "").replace(/-ii$/, "").replace(/\d+$/, "").replace(/-$/, "") || id;
  }

  function bySeries(a, b) {
    const sa = seriesKey(a), sb = seriesKey(b);
    if (sa !== sb) return sa < sb ? -1 : 1;
    const na = (a.id.match(/(\d+)$/) || ["","0"])[1].padStart(3, "0");
    const nb = (b.id.match(/(\d+)$/) || ["","0"])[1].padStart(3, "0");
    if (na !== nb) return na < nb ? -1 : 1;
    return (a.title || "").localeCompare(b.title || "", "zh");
  }

  function packTitle(id) {
    const p = PACKS.find((x) => x.id === id);
    if (p) return p.title;
    const f = FAMILIES.find((x) => x.id === id);
    return f ? f.title : "其他";
  }

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
    return [g.title, g.subtitle, g.tag, g.blurb, packTitle(packOf(g))].join(" ").toLowerCase();
  }

  function paintFilters() {
    if (!filtersEl) return;
    if (!filtersEl.childElementCount) {
      FAMILIES.forEach((f) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "chip";
        btn.dataset.id = f.id;
        btn.textContent = f.title;
        btn.addEventListener("click", () => {
          filter = f.id;
          sub = "all";
          render();
        });
        filtersEl.appendChild(btn);
      });
    }
    filtersEl.querySelectorAll(".chip").forEach((btn) => {
      btn.setAttribute("aria-pressed", btn.dataset.id === filter ? "true" : "false");
    });
    if (!subsEl) return;
    const showSubs = filter === "remake" || filter === "all";
    subsEl.classList.toggle("hidden", !showSubs);
    if (!showSubs) return;
    if (!subsEl.childElementCount) {
      const all = document.createElement("button");
      all.type = "button";
      all.className = "chip";
      all.dataset.id = "all";
      all.textContent = "小类";
      all.addEventListener("click", () => { sub = "all"; render(); });
      subsEl.appendChild(all);
      PACKS.forEach((p) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "chip";
        btn.dataset.id = p.id;
        btn.textContent = p.title;
        btn.addEventListener("click", () => { sub = p.id; filter = "remake"; render(); });
        subsEl.appendChild(btn);
      });
    }
    subsEl.querySelectorAll(".chip").forEach((btn) => {
      btn.setAttribute("aria-pressed", btn.dataset.id === sub ? "true" : "false");
    });
  }

  function listed(needle) {
    if (needle) return games.filter((g) => hay(g).includes(needle));
    if (filter === "picks") {
      const byId = new Map(games.map((g) => [g.id, g]));
      return PICKS.map((id) => byId.get(id)).filter(Boolean);
    }
    if (filter === "remake") {
      let list = games.filter((g) => familyOf(g) === "remake");
      if (sub !== "all") list = list.filter((g) => packOf(g) === sub);
      return list.slice().sort(bySeries);
    }
    if (filter === "all") return games.slice().sort((a, b) => {
      const pa = packOf(a), pb = packOf(b);
      if (pa !== pb) {
        const ia = PACKS.findIndex((p) => p.id === pa);
        const ib = PACKS.findIndex((p) => p.id === pb);
        const oa = ia < 0 ? 90 : ia, ob = ib < 0 ? 90 : ib;
        if (oa !== ob) return oa - ob;
        return pa < pb ? -1 : 1;
      }
      return bySeries(a, b);
    });
    return games.filter((g) => familyOf(g) === filter).slice().sort(bySeries);
  }

  function render() {
    paintFilters();
    const needle = (q.value || "").trim().toLowerCase();
    const list = listed(needle);
    grid.innerHTML = "";
    grid.classList.toggle("featured", !needle && filter === "picks");
    const fam = FAMILIES.find((f) => f.id === filter) || FAMILIES[0];
    if (shelfHead) {
      if (needle) shelfHead.textContent = list.length ? ("\u641c\u5230 " + list.length + " \u6b3e") : "\u6ca1\u6709\u53eb\u8fd9\u4e2a\u7684\u620f";
      else if (filter === "remake" && sub !== "all") {
        const p = PACKS.find((x) => x.id === sub);
        shelfHead.textContent = (p ? p.title : "") + " \u00b7 " + (p && p.hint ? p.hint + " \u00b7 " : "") + list.length + " \u6b3e";
      } else if (fam.hint) shelfHead.textContent = fam.title + " \u00b7 " + fam.hint;
      else shelfHead.textContent = fam.title + " \u00b7 " + list.length + " \u6b3e";
    }
    if (!games.length && !needle) {
      empty.classList.add("hidden");
      grid.textContent = "\u8fd8\u6ca1\u6709\u8fc7\u5173\u7684\u6e38\u620f\u3002\u7b2c\u4e00\u6279\u5199\u5b8c\u4f1a\u6302\u5230\u8fd9\u91cc\u3002";
      return;
    }
    const shelve = !needle && (filter === "remake" || filter === "all") && sub === "all";
    grid.classList.toggle("shelved", shelve);
    if (shelve) {
      const groups = [];
      let cur = null;
      list.forEach((g) => {
        const pid = packOf(g);
        if (!cur || cur.id !== pid) {
          cur = { id: pid, title: packTitle(pid), items: [] };
          groups.push(cur);
        }
        cur.items.push(g);
      });
      groups.forEach((grp) => {
        const lab = document.createElement("p");
        lab.className = "shelf-label";
        lab.textContent = grp.title + " · " + grp.items.length;
        grid.appendChild(lab);
        const row = document.createElement("div");
        row.className = "shelf-row";
        grp.items.forEach((g, i) => row.appendChild(card(g, i)));
        grid.appendChild(row);
      });
    } else {
      list.forEach((g, i) => grid.appendChild(card(g, i)));
    }
    let msg = "";
    if (!list.length) {
      if (needle) msg = "\u6ca1\u6709\u53eb\u8fd9\u4e2a\u7684\u620f";
      else if (filter === "remake") msg = "\u590d\u523b\u8fd8\u5728\u5199\uff0c\u5148\u73a9\u7cbe\u9009\u3002";
      else msg = "\u8fd9\u5c42\u8fd8\u662f\u7a7a\u7684\u3002";
    }
    empty.textContent = msg || "\u6ca1\u6709\u53eb\u8fd9\u4e2a\u7684\u620f";
    empty.classList.toggle("hidden", !msg);
  }

  function hrefOf(g) {
    if (g.url) return g.url;
    if (g.dir) return g.dir.startsWith(".") ? g.dir : "./" + g.dir;
    return "./g/" + g.id + "/";
  }

  function kinOf(g) {
    const sid = seriesKey(g);
    const same = games.filter((x) => x.id !== g.id && seriesKey(x) === sid).sort(bySeries);
    const rest = games.filter((x) => x.id !== g.id && packOf(x) === packOf(g) && seriesKey(x) !== sid).sort(bySeries);
    return same.concat(rest);
  }

  function paintMore(g) {
    if (!moreEl) return;
    moreEl.innerHTML = "";
    const kin = kinOf(g);
    if (!kin.length) {
      moreEl.classList.add("hidden");
      return;
    }
    moreEl.classList.remove("hidden");
    const lab = document.createElement("span");
    lab.className = "more-lab";
    lab.textContent = "类似 · " + packTitle(packOf(g));
    moreEl.appendChild(lab);
    const ring = games.filter((x) => packOf(x) === packOf(g)).sort(bySeries);
    const ix = ring.findIndex((x) => x.id === g.id);
    if (ring.length > 1 && ix >= 0) {
      const prev = document.createElement("button");
      prev.type = "button";
      prev.className = "more-nav";
      prev.textContent = "上一款";
      prev.addEventListener("click", () => openGame(ring[(ix - 1 + ring.length) % ring.length]));
      moreEl.appendChild(prev);
    }
    kin.slice(0, 8).forEach((x) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "more-chip";
      btn.textContent = x.title;
      btn.title = x.blurb || x.subtitle || "";
      btn.addEventListener("click", () => openGame(x));
      moreEl.appendChild(btn);
    });
    if (ring.length > 1 && ix >= 0) {
      const next = document.createElement("button");
      next.type = "button";
      next.className = "more-nav";
      next.textContent = "下一款";
      next.addEventListener("click", () => openGame(ring[(ix + 1) % ring.length]));
      moreEl.appendChild(next);
    }
  }

  function openGame(g) {
    playTitle.textContent = g.title;
    playSub.textContent = g.subtitle || "";
    const src = hrefOf(g);
    openTab.href = src;
    frame.src = src;
    paintMore(g);
    lobby.classList.add("hidden");
    play.classList.remove("hidden");
    history.replaceState({ play: g.id }, "", "#/" + g.id);
  }

  function closeGame() {
    frame.src = "about:blank";
    if (moreEl) moreEl.innerHTML = "";
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
