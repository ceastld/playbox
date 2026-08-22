如何玩：方向键 / WASD / 滑动 / 点相邻格 / 屏幕十字移动品红角色；青色镜影同步反步（横向对折左右相反，纵向上下相反，中心对点则完全反向）。
如何赢：30 关内让两人同时站上金色光点；任一方踏入虚空或走出非循环边界即坠落。第 8 关起多数关有步数上限（HUD 显示 已走 / 上限），超出后按坠落处理，文案为「步数用尽」，Z 仍可撤销。
循环关（环缘、残阶、伪光、夹径、潜影、迷径、幻阶、双渊、终局）从一边走出会在对边出现，仍可能踏空。

改了什么：1–4 关（对影、裂口、勿右、深巷）仍是教学，深巷略加长。5–30 全部换成更长的原关：诱饵砖、假光点、单边走廊，后期最短 8–12 步。第 8 关起加步数上限（最短路 +2 或 +3）。BFS 联立状态求解，全部可解；教程后无 ≤3 步关，新关 17 个最短 ≥8，6 个 ≥11。

已知限制：无选关，刷新后从标题重来；不支持斜向；静音键 M，状态记在本机。
最短参考：对影 RR · 裂口 RDR · 勿右 DDDRR · 深巷 DDDDDRR · 倒折 RRDD · 环缘 RDDDLD · 反步 RDRD · 错砖 DDDDDRRUUUUU · 纵裂 RRRRRDDLLLLL · 穿隙 RRRRDDDD · 残阶 UUUURRU · 暗桥 RRRRRDDLL · 伪光 UURRUU · 绕行 LDDDRRDDLL · 夹径 URRDRRD · 断轴 RRDRD · 回旋 DDDDDRRUUUUU · 虚廊 LDDRRRRRU · 逆行 RRRRDDLD · 潜影 UUUURRUU · 迷径 UUURRDDD · 裂渊 LLLLLDDRR · 困局 LDDDDDRRUUU · 绝径 RDDRDDDLLUU · 幻阶 URRRDRD · 双渊 DDDDRRDD · 残镜 RDRD · 终局 UUURRDDD · 空阶 ULLLLLDDRRR · 刺廊 DDDDDRRUU。
