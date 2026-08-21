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

  function card(g, i) {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "card";
    el.style.setProperty("--h", String(g.hue ?? 300));
    const n = String(i + 1).padStart(2, "0");
    el.innerHTML = `<span class="idx">${n}</span>
      <span class="badge">${escapeHtml(g.tag || "游戏")}</span>
      <h2>${escapeHtml(g.title)}</h2>
      <p class="sub">${escapeHtml(g.subtitle || "")}</p>
      <p class="blurb">${escapeHtml(g.blurb || "")}</p>`;
    el.addEventListener("click", () => openGame(g));
    return el;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
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

  function openGame(g) {
    playTitle.textContent = g.title;
    playSub.textContent = g.subtitle || "";
    openTab.href = g.url;
    frame.src = g.url;
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
