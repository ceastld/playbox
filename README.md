# 百戏 · PLAYBOX

一百一十一个小游戏。每个游戏一个目录，互不重编。大厅默认看精选，按复刻 / 节奏 / 水面 / 巧思 / 动作 / 养成筛，也能搜。

现在在写经典复刻，质量优先，手感要爽，不堆新原创。已上架：2048、贪吃蛇、扫雷、俄罗斯方块、2048·五、门蛇、破砖、蜂雷、四十行、箱迷、墙乒。

- 大厅读 `catalog.json`（只含已过关的）。复刻条目带 `kind: remake` 和 `url`
- 待做清单在 `plan.json`
- 门槛在 `QUALITY.md`
- 新游戏：写入 `g/<id>/`（`index.html` + `css/style.css` + `js/game.js`），过关后往 catalog 加一条（记得写 `url`），推 main 即可
- GitHub Pages 发布根目录

https://ceastld.github.io/playbox/
