# 近五年国考空间题 · 3D 演练覆盖决策（2022—2026）

更新日期：2026-10-14。范围：审计清单中的 29 道去重国考空间题。

## 原则

1. **精确还原（exact）**：仅当题干/解析图足以唯一确定几何（展开网拓扑、积木体素、截面三点等）并完成核对后，才设置 `simulatorConfig.isExact: true`。
2. **相关考点演示（related）**：几何无法从公开回忆图可靠重建时，挂接对应专题通用演练台（折纸盒 / 拼合 / 截面 / 三视图 / 平面折叠），文案必须含「相关考点演示」且 **不得** 声称精确还原。
3. **不挂接（none）**：暂无合适演练台或挂接会误导时保留为空（本轮为 0）。
4. 原创专项训练题（`spatial:*`）仍禁止广告未核实的 `simulatorConfig`（见 `validate-spatial-training.mjs`）。
5. `isExact: true` 必须出现在 `docs/spatial-3d-exact-allowlist.json`，否则银行校验失败。

## 覆盖汇总

| 决策 | 题数 |
|---|---:|
| exact（精确还原） | 0 |
| related（相关考点演示） | 29 |
| none | 0 |

本轮 **无一题** 升格为 exact：回忆卷图源不足以自信重建逐题 3D；一律 related，并按类别跳转通用演练台，部分带 `mode` 提示（如黑白三视图 → `bw_blocks`）。

## 逐题决策

| ID | 年 | 专项 | 决策 | 演练台 | mode/params | 备注 |
|---|---|---|---|---|---|---|
| errrc:4637338 | 2022 | assembly | related | assembly | — | 多正方体分层拼合；无精确体素清单 |
| errrc:4637364 | 2022 | cross_section | related | cross_section | preset triangle | 剖切图；三点/曲面未核验 |
| errrc:4637564 | 2022 | cross_section | related | cross_section | preset triangle | 空心相交；通用截面器 |
| errrc:4637401 | 2022 | origami | related | origami | 1-4-1 | 六面体折叠；网未核验 |
| errrc:4639349 | 2022 | origami | related | origami | 1-4-1 | 公共边法；网未核验 |
| errrc:5445798 | 2023 | assembly | related | assembly | — | 切割重组 |
| errrc:5445914 | 2023 | assembly | related | assembly | — | 凹凸互补 |
| errrc:5445843 | 2023 | cross_section | related | cross_section | — | 圆柱挖空选非；已有相关演示 |
| errrc:5445923 | 2023 | origami | related | origami | 2-3-1 | 公共点/边 |
| errrc:5445822 | 2023 | paper_folding | related | paper_folding | double_fold | 直角三角形两次折叠面积；通用折纸台 |
| errrc:5445823 | 2023 | views | related | views | hidden_edges | 视图选非；可见/隐藏棱演示 |
| errrc:5893669 | 2024 | assembly | related | assembly | — | 灰块颜色对位；已有相关演示 |
| errrc:5894887 | 2024 | assembly | related | assembly | — | 多面体凹凸 |
| errrc:5893673 | 2024 | cross_section | related | cross_section | preset triangle | 三点定面 |
| errrc:5894980 | 2024 | cross_section | related | cross_section | preset triangle | 三点定面 |
| errrc:5893661 | 2024 | origami | related | origami | 1-4-1 | 外表面展开对应 |
| errrc:5895236 | 2024 | origami | related | origami | 1-4-1 | **长方体**灰块展开；无长方体专用精确模型 → related only，待人工核验是否另建 viewer |
| errrc:19283877 | 2025 | assembly | related | assembly | — | 多组件选非 |
| errrc:19283916 | 2025 | assembly | related | assembly | — | 灰块对位；已有相关演示 |
| errrc:19283859 | 2025 | cross_section | related | cross_section | preset triangle | 三点定面 |
| errrc:19283965 | 2025 | cross_section | related | cross_section | preset triangle | 三点定面 |
| errrc:19283845 | 2025 | origami | related | origami | — | 字母朝向；已有相关演示 |
| errrc:19283952 | 2025 | origami | related | origami | 1-4-1 | 公共边法 |
| errrc:19526323 | 2026 | assembly | related | assembly | — | 多块选非；已有相关演示 |
| errrc:19526428 | 2026 | assembly | related | assembly | — | 多块选非；已有相关演示 |
| errrc:19526333 | 2026 | cross_section | related | cross_section | — | 三点定面；已有相关演示 |
| errrc:19526329 | 2026 | origami | related | origami | 1-4-1 | 特征面描边匹配 |
| errrc:19526393 | 2026 | origami | related | origami | — | 相对面排除；已有相关演示 |
| errrc:19526397 | 2026 | views | related | views | bw_blocks | 黑白方块俯视/左视反推正视 |

## 待人工 / Coding 复核（升格 exact 候选）

下列题若能从高清原图或权威解析重建唯一几何，可考虑 exact，并写入 allowlist：

1. **errrc:5895236**（2024 长方体灰块外表面）— 需长方体尺寸与灰块坐标的专用模型，当前折纸盒为正方体网。
2. **errrc:19526397**（2026 黑白三视图）— 15 白 + 3 黑的柱高/颜色矩阵若可唯一读取，可做精确体素。
3. **errrc:5445822**（2023 直角三角形两次折叠）— 若折痕分区 a/b/c/d 尺寸可测，可做精确折纸面积模型。
4. 各年 **标准正方体展开图** 题（如 4637401、4639349、19283845、19526393 等）— 在确认展开图与 11 网之一同构且图案朝向可映射后，可绑 `mode: net-XX` + `isExact: true`。
5. **三点定面截面** 系列 — 在读出 P/Q/R 棱上参数后可绑 CrossSection 预设或专用截面。

## 如何验收

真题实训 → 空间推理专项 → 任选国考回忆题 → 题干下「相关考点演示」按钮应进入对应 3D 页，顶栏悬浮条显示「相关考点演示中」。
