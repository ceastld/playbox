(() => {
  const grid = document.getElementById("grid");
  const lobby = document.getElementById("lobby");
  const play = document.getElementById("play");
  const frame = document.getElementById("frame");
  const playTitle = document.getElementById("play-title");
  const playSub = document.getElementById("play-sub");
  const openTab = document.getElementById("open-tab");

  let games = [];

  function card(g) {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "card";
    el.style.setProperty("--h", String(g.hue ?? 300));
    el.innerHTML = `<span class="badge">${escapeHtml(g.tag || "游戏")}</span>
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
      grid.innerHTML = "";
      games.forEach((g) => grid.appendChild(card(g)));
      if (!games.length) grid.textContent = "还没有过关的游戏。第一批写完会挂到这里。";
      route();
    })
    .catch(() => {
      grid.textContent = "目录加载失败。确认 catalog.json 和本页在一起发布。";
    });
})();
