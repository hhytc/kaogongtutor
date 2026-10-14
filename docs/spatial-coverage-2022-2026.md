# 空间推理专项覆盖核查与补充（2022—2026）

核查日期：2026-10-14。范围：国考图形推理中的空间专项；保留原有省考题和数量关系几何拓展。核查与补充阶段未提交、推送或部署；后续发布状态以 GitHub Actions 和线上验收为准。

## 结论与大纲边界

原模块覆盖不全。原题库中的近五年国考空间题仅覆盖本次核对的 29 道去重题中的 8 道，缺少三视图与平面折叠两类，已有折纸盒、拼合、截面也存在子题型缺口。已补入缺少的 21 道国考回忆题，以及 20 道原创专项训练题。

[国家公务员局发布的 2026 年公共科目笔试考试大纲（国家林草局转载）](https://www.forestry.gov.cn/c/www/gsgg/645383.jhtml)列明判断推理包含图形推理，并给出空心立体的截面例题。它没有公布可逐项勾选的“全部空间推理知识点清单”。因此，下列五类是根据近五年公开回忆卷归纳的训练分类，不能声称是官方穷尽目录或保证覆盖未来所有命题。

表面最短路径、旋转体体积属于本项目的几何计算拓展，不计入此次五类空间专项的覆盖统计和限时测验。一般平面图形规律、逻辑判断等其他行测专题也不在此次核查范围。

## 题型与薄弱点

| 专项 | 原有覆盖的不足 | 补充后的近五年国考题 | 新增原创题 |
|---|---|---:|---:|
| 折纸盒与外表面展开 | 3D 只有四大家族代表构型；缺少长方体尺寸及灰块朝向、双立方体对应等题目 | 9 | 4 |
| 立体拼合与组合体 | 原演示以 3×3×3 为主；多组件、颜色对位、镜像与旋转需强化 | 9 | 2 |
| 截面与切割 | 原 3D 以实心正方体为主；三点定面、空心挖空与组合体需补充 | 8 | 2 |
| 三视图与可见棱线 | 缺少独立题型与训练；视图反推、遮挡、黑白方块约束未覆盖 | 2 | 8 |
| 平面折叠与折纸图形 | 缺少独立题型与训练；折后占地、重叠面积及层序未覆盖 | 1 | 4 |
| 合计 | 原先 8 道近五年国考空间题 | 29 | 20 |

空间专项精选测验池共 49 题。整个项目保留原题后共 96 题：15 道原内置题、40 道原外部精选题、21 道此次新增国考题、20 道原创题；侧栏题型计数包含原省考题，因此与专项精选池的计数不同。

11 种正方体展开图已以完整图谱、合法性识别题和解析补充；原 3D 动态折叠仍是四大家族代表构型。此次没有为三视图、平面折叠及每道国考题伪造精确 3D 模型；新增训练使用经过验证的二维图例。已有通用模型继续标为“相关考点演示”。

## 近五年试卷核对方法

按考试年度取 2022—2026，逐年核对副省、地市和行政执法三种公开整卷回忆版本，共 15 卷。先从固定版本的整理题库筛选图形推理记录，再与整卷 PDF 的图形推理段逐题对照图形、选项和题号，处理跨卷重复。

整理题库：[ERRRC/kaogongzhentizhengliu](https://github.com/ERRRC/kaogongzhentizhengliu/tree/84ab93d4b64b61d897bece8a1c0a5bab06b4feb2)，固定修订 `84ab93d4b64b61d897bece8a1c0a5bab06b4feb2`。本次库存中有 91 道去重的近五年图形推理记录，其中 29 道属于空间专项；整卷交叉核对得到 45 次空间题出现，去重后同为 29 道，没有发现所选回忆卷中另有未收录的空间题。

| 年度 | 整卷数 | 空间题出现次数 | 去重题数 | 原已收录 | 此次补充 |
|---|---:|---:|---:|---:|---:|
| 2022 | 3 | 9 | 5 | 0 | 5 |
| 2023 | 3 | 9 | 6 | 1 | 5 |
| 2024 | 3 | 9 | 6 | 1 | 5 |
| 2025 | 3 | 9 | 6 | 2 | 4 |
| 2026 | 3 | 9 | 6 | 4 | 2 |

2023 年地市/行政执法回忆卷出现折纸投影面积题，行政执法卷出现视图“选非”题；2026 年副省/地市回忆卷出现黑白方块的俯视、左视约束反推正视图。它们直接支持新增平面折叠与三视图专项。

### 整卷来源与逐题位置

下表题号仅对应链接中的回忆版本，不作为官方统一编号。有的 PDF 页面印刷题号与嵌入文本编号不同；同年相似题干也可能配有不同图形，已按图形而非题干去重。

| 年度 | 回忆卷来源 | 空间题位置与专项 |
|---|---|---|
| 2022 | [副省卷](https://upload.xingguanggongkao.com/pdf/2022%E5%B9%B4%E5%9B%BD%E5%AE%B6%E5%85%AC%E5%8A%A1%E5%91%98%E5%BD%95%E7%94%A8%E8%80%83%E8%AF%95%E3%80%8A%E8%A1%8C%E6%B5%8B%E3%80%8B%E7%9C%9F%E9%A2%98%EF%BC%88%E5%89%AF%E7%9C%81%E5%8D%B7-%E8%80%83%E7%94%9F%E5%9B%9E%E5%BF%86%E7%89%88%EF%BC%89.pdf?time=1733729918) | 80：折纸盒与外表面展开；81：截面与切割；82：立体拼合与组合体 |
| 2022 | [地市卷](https://upload.xingguanggongkao.com/pdf/2022%E5%B9%B4%E5%9B%BD%E5%AE%B6%E5%85%AC%E5%8A%A1%E5%91%98%E5%BD%95%E7%94%A8%E8%80%83%E8%AF%95%E3%80%8A%E8%A1%8C%E6%B5%8B%E3%80%8B%E7%9C%9F%E9%A2%98%EF%BC%88%E5%B8%82%E5%9C%B0%E5%8D%B7-%E8%80%83%E7%94%9F%E5%9B%9E%E5%BF%86%E7%89%88%EF%BC%89.pdf?time=1733729914) | 75：截面与切割；76：折纸盒与外表面展开；77：立体拼合与组合体 |
| 2022 | [行政执法卷](https://upload.xingguanggongkao.com/pdf/2022%E5%B9%B4%E5%9B%BD%E5%AE%B6%E5%85%AC%E5%8A%A1%E5%91%98%E5%BD%95%E7%94%A8%E8%80%83%E8%AF%95%E3%80%8A%E8%A1%8C%E6%B5%8B%E3%80%8B%E7%9C%9F%E9%A2%98%EF%BC%88%E8%A1%8C%E6%94%BF%E6%89%A7%E6%B3%95%E5%8D%B7-%E8%80%83%E7%94%9F%E5%9B%9E%E5%BF%86%E7%89%88%EF%BC%89.pdf?time=1733729910) | 75：折纸盒与外表面展开；76：截面与切割；77：立体拼合与组合体 |
| 2023 | [副省卷](https://exam2.gwyks.cn/papermain/downloadPDF?id=3382316&type=2) | 80：截面与切割；81：折纸盒与外表面展开；82：立体拼合与组合体 |
| 2023 | [地市卷](https://exam2.gwyks.cn/papermain/downloadPDF?id=3382449&type=2) | 75：平面折叠与折纸图形；76：截面与切割；77：立体拼合与组合体 |
| 2023 | [行政执法卷](https://upload.xingguanggongkao.com/pdf/2023%E5%B9%B4%E5%9B%BD%E5%AE%B6%E5%85%AC%E5%8A%A1%E5%91%98%E5%BD%95%E7%94%A8%E8%80%83%E8%AF%95%E3%80%8A%E8%A1%8C%E6%B5%8B%E3%80%8B%E7%9C%9F%E9%A2%98%EF%BC%88%E8%A1%8C%E6%94%BF%E6%89%A7%E6%B3%95%E5%8D%B7-%E8%80%83%E7%94%9F%E5%9B%9E%E5%BF%86%E7%89%88%EF%BC%89.pdf?time=1733730137) | 75：平面折叠与折纸图形；76：三视图与可见棱线；77：立体拼合与组合体 |
| 2024 | [副省卷](https://static.32xueyuan.com/zq/u/cms/www/202410/09100412q9dd.pdf) | 80：立体拼合与组合体；81：截面与切割；82：折纸盒与外表面展开 |
| 2024 | [地市卷](https://gz163rsw.com/Uploads/202409/66dd6e15f0e02.pdf) | 74：立体拼合与组合体；76：折纸盒与外表面展开；77：截面与切割 |
| 2024 | [行政执法卷](https://upload.xingguanggongkao.com/pdf/2024%E5%B9%B4%E5%9B%BD%E5%AE%B6%E5%85%AC%E5%8A%A1%E5%91%98%E8%80%83%E8%AF%95%E3%80%8A%E8%A1%8C%E6%B5%8B%E3%80%8B%E7%9C%9F%E9%A2%98%EF%BC%88%E8%A1%8C%E6%94%BF%E6%89%A7%E6%B3%95%E5%8D%B7-%E8%80%83%E7%94%9F%E5%9B%9E%E5%BF%86%E7%89%88%EF%BC%89.pdf?time=1733730291) | 75：立体拼合与组合体；76：折纸盒与外表面展开；77：截面与切割 |
| 2025 | [副省卷](https://upload.xingguanggongkao.com/pdf/2025%E5%B9%B4%E5%9B%BD%E5%AE%B6%E5%85%AC%E5%8A%A1%E5%91%98%E5%BD%95%E7%94%A8%E8%80%83%E8%AF%95%E3%80%8A%E8%A1%8C%E6%B5%8B%E3%80%8B%E7%9C%9F%E9%A2%98%EF%BC%88%E5%89%AF%E7%9C%81%E5%8D%B7-%E8%80%83%E7%94%9F%E5%9B%9E%E5%BF%86%E7%89%88%EF%BC%89---%E4%BC%B0%E5%88%86.pdf?time=1733730497) | 85：立体拼合与组合体；86：折纸盒与外表面展开；87：截面与切割 |
| 2025 | [地市卷](https://upload.xingguanggongkao.com/pdf/2025%E5%B9%B4%E5%9B%BD%E5%AE%B6%E5%85%AC%E5%8A%A1%E5%91%98%E5%BD%95%E7%94%A8%E8%80%83%E8%AF%95%E3%80%8A%E8%A1%8C%E6%B5%8B%E3%80%8B%E7%9C%9F%E9%A2%98%EF%BC%88%E5%9C%B0%E5%B8%82%E5%8D%B7-%E8%80%83%E7%94%9F%E5%9B%9E%E5%BF%86%E7%89%88%EF%BC%89---%E4%BC%B0%E5%88%86.pdf?time=1733730489) | 80：折纸盒与外表面展开；81：截面与切割；82：立体拼合与组合体 |
| 2025 | [行政执法卷](https://upload.xingguanggongkao.com/pdf/2025%E5%B9%B4%E5%9B%BD%E5%AE%B6%E5%85%AC%E5%8A%A1%E5%91%98%E5%BD%95%E7%94%A8%E8%80%83%E8%AF%95%E3%80%8A%E8%A1%8C%E6%B5%8B%E3%80%8B%E7%9C%9F%E9%A2%98%EF%BC%88%E8%A1%8C%E6%94%BF%E6%89%A7%E6%B3%95%E5%8D%B7-%E8%80%83%E7%94%9F%E5%9B%9E%E5%BF%86%E7%89%88%EF%BC%89---%E4%BC%B0%E5%88%86.pdf?time=1733730493) | 80：截面与切割；81：立体拼合与组合体；82：折纸盒与外表面展开 |
| 2026 | [副省卷](https://upload.xingguanggongkao.com/pdf/2026%E5%B9%B4%E5%9B%BD%E5%AE%B6%E5%85%AC%E5%8A%A1%E5%91%98%E5%BD%95%E7%94%A8%E8%80%83%E8%AF%95%E3%80%8A%E8%A1%8C%E6%B5%8B%E3%80%8B%E7%9C%9F%E9%A2%98%EF%BC%88%E5%89%AF%E7%9C%81%E5%8D%B7-%E8%80%83%E7%94%9F%E5%9B%9E%E5%BF%86%E7%89%88%EF%BC%89-%E4%BC%B0%E5%88%86.pdf?time=1764726077) | 86：三视图与可见棱线；87：折纸盒与外表面展开；88：立体拼合与组合体 |
| 2026 | [地市卷](https://upload.xingguanggongkao.com/pdf/2026%E5%B9%B4%E5%9B%BD%E5%AE%B6%E5%85%AC%E5%8A%A1%E5%91%98%E5%BD%95%E7%94%A8%E8%80%83%E8%AF%95%E3%80%8A%E8%A1%8C%E6%B5%8B%E3%80%8B%E7%9C%9F%E9%A2%98%EF%BC%88%E5%9C%B0%E5%B8%82%E5%8D%B7-%E8%80%83%E7%94%9F%E5%9B%9E%E5%BF%86%E7%89%88%EF%BC%89-%E4%BC%B0%E5%88%86.pdf?time=1764726045) | 80：三视图与可见棱线；81：折纸盒与外表面展开；82：立体拼合与组合体 |
| 2026 | [行政执法卷](https://upload.xingguanggongkao.com/pdf/2026%E5%B9%B4%E5%9B%BD%E5%AE%B6%E5%85%AC%E5%8A%A1%E5%91%98%E5%BD%95%E7%94%A8%E8%80%83%E8%AF%95%E3%80%8A%E8%A1%8C%E6%B5%8B%E3%80%8B%E7%9C%9F%E9%A2%98%EF%BC%88%E8%A1%8C%E6%94%BF%E6%89%A7%E6%B3%95%E5%8D%B7-%E8%80%83%E7%94%9F%E5%9B%9E%E5%BF%86%E7%89%88%EF%BC%89.pdf?time=1764503955) | 80（页印 65）：截面与切割；81（页印 66）：折纸盒与外表面展开；82（页印 67）：立体拼合与组合体 |

完整出现记录、来源 URL 与已下载 PDF 的 SHA-256 保存于 [guokao_spatial_papers.json](../public/data/errrc/guokao_spatial_papers.json)；29 道题的来源与是否新增保存于 [guokao_spatial_audit.json](../public/data/errrc/guokao_spatial_audit.json)。

### 去重后的 29 道空间题

| 年度 | 题目 ID / 整理来源 | 专项 | 入库情况 |
|---|---|---|---|
| 2022 | [errrc:4637338](https://github.com/ERRRC/kaogongzhentizhengliu/blob/84ab93d4b64b61d897bece8a1c0a5bab06b4feb2/10-%E7%9C%9F%E9%A2%98/%E5%88%A4%E6%96%AD%E6%8E%A8%E7%90%86/%E5%9B%BE%E5%BD%A2%E6%8E%A8%E7%90%86/4637338%20%E5%9B%BE%E5%BD%A2%E6%8E%A8%E7%90%86-%E7%AB%8B%E4%BD%93%E6%8B%BC%E5%90%88%EF%BC%88%E5%A4%9A%E6%AD%A3%E6%96%B9%E4%BD%93%E7%BB%84%E5%90%88%E6%8B%86%E5%88%86%C2%B7%E5%88%86%E5%B1%82%E8%AE%A1%E6%95%B0%2B%E5%87%B9%E5%87%B8%E4%B8%80%E8%87%B4%EF%BC%89.md) | 立体拼合与组合体 | 此次新增 |
| 2022 | [errrc:4637364](https://github.com/ERRRC/kaogongzhentizhengliu/blob/84ab93d4b64b61d897bece8a1c0a5bab06b4feb2/10-%E7%9C%9F%E9%A2%98/%E5%88%A4%E6%96%AD%E6%8E%A8%E7%90%86/%E5%9B%BE%E5%BD%A2%E6%8E%A8%E7%90%86/4637364%20%E6%88%AA%E9%9D%A2%E5%9B%BE%EF%BC%88%E7%AB%8B%E4%BD%93%E5%9B%BE%E5%BD%A2%E5%89%96%E5%88%87%EF%BC%89.md) | 截面与切割 | 此次新增 |
| 2022 | [errrc:4637564](https://github.com/ERRRC/kaogongzhentizhengliu/blob/84ab93d4b64b61d897bece8a1c0a5bab06b4feb2/10-%E7%9C%9F%E9%A2%98/%E5%88%A4%E6%96%AD%E6%8E%A8%E7%90%86/%E5%9B%BE%E5%BD%A2%E6%8E%A8%E7%90%86/4637564%20%E6%88%AA%E9%9D%A2%E5%9B%BE-%E5%89%96%E5%88%87%E9%9D%A2%E4%B8%8E%E7%A9%BA%E5%BF%83%E7%AB%8B%E4%BD%93%E7%9A%84%E7%9B%B8%E4%BA%A4%E5%88%A4%E6%96%AD.md) | 截面与切割 | 此次新增 |
| 2022 | [errrc:4637401](https://github.com/ERRRC/kaogongzhentizhengliu/blob/84ab93d4b64b61d897bece8a1c0a5bab06b4feb2/10-%E7%9C%9F%E9%A2%98/%E5%88%A4%E6%96%AD%E6%8E%A8%E7%90%86/%E5%9B%BE%E5%BD%A2%E6%8E%A8%E7%90%86/4637401%20%E7%A9%BA%E9%97%B4%E9%87%8D%E6%9E%84-%E5%85%AD%E9%9D%A2%E4%BD%93%E6%8A%98%E5%8F%A0%EF%BC%88%E7%94%BB%E8%BE%B9%E6%B3%95%E6%AF%94%E8%BE%83%E7%9B%B8%E9%82%BB%E9%9D%A2%E6%89%BE%E5%BC%82%E9%A1%B9%EF%BC%89.md) | 折纸盒与外表面展开 | 此次新增 |
| 2022 | [errrc:4639349](https://github.com/ERRRC/kaogongzhentizhengliu/blob/84ab93d4b64b61d897bece8a1c0a5bab06b4feb2/10-%E7%9C%9F%E9%A2%98/%E5%88%A4%E6%96%AD%E6%8E%A8%E7%90%86/%E5%9B%BE%E5%BD%A2%E6%8E%A8%E7%90%86/4639349%20%E7%A9%BA%E9%97%B4%E9%87%8D%E6%9E%84-%E5%85%AD%E9%9D%A2%E4%BD%93%E6%8A%98%E5%8F%A0%EF%BC%88%E5%85%AC%E5%85%B1%E8%BE%B9%E6%B3%95%EF%BC%89.md) | 折纸盒与外表面展开 | 此次新增 |
| 2023 | [errrc:5445798](https://github.com/ERRRC/kaogongzhentizhengliu/blob/84ab93d4b64b61d897bece8a1c0a5bab06b4feb2/10-%E7%9C%9F%E9%A2%98/%E5%88%A4%E6%96%AD%E6%8E%A8%E7%90%86/%E5%9B%BE%E5%BD%A2%E6%8E%A8%E7%90%86/5445798%20%E7%AB%8B%E4%BD%93%E6%8B%BC%E5%90%88%EF%BC%88%E5%A4%9A%E9%9D%A2%E4%BD%93%E5%88%87%E5%89%B2%E9%87%8D%E7%BB%84%E3%80%81%E6%97%8B%E8%BD%AC%E5%BD%92%E4%BD%8D%EF%BC%89.md) | 立体拼合与组合体 | 此次新增 |
| 2023 | [errrc:5445914](https://github.com/ERRRC/kaogongzhentizhengliu/blob/84ab93d4b64b61d897bece8a1c0a5bab06b4feb2/10-%E7%9C%9F%E9%A2%98/%E5%88%A4%E6%96%AD%E6%8E%A8%E7%90%86/%E5%9B%BE%E5%BD%A2%E6%8E%A8%E7%90%86/5445914%20%E7%AB%8B%E4%BD%93%E6%8B%BC%E5%90%88%EF%BC%88%E6%95%B4%E4%BD%93%E5%88%87%E5%89%B2%E5%A4%8D%E5%8E%9F-%E5%89%A9%E4%BD%99%E7%A9%BA%E9%97%B4%E5%87%B9%E5%87%B8%E4%BA%92%E8%A1%A5%EF%BC%89.md) | 立体拼合与组合体 | 此次新增 |
| 2023 | [errrc:5445843](https://github.com/ERRRC/kaogongzhentizhengliu/blob/84ab93d4b64b61d897bece8a1c0a5bab06b4feb2/10-%E7%9C%9F%E9%A2%98/%E5%88%A4%E6%96%AD%E6%8E%A8%E7%90%86/%E5%9B%BE%E5%BD%A2%E6%8E%A8%E7%90%86/5445843%20%E6%88%AA%E9%9D%A2%E5%9B%BE-%E5%9C%86%E6%9F%B1%E7%BB%84%E5%90%88%E4%BD%93%E6%8C%96%E7%A9%BA%E6%88%AA%E9%9D%A2%E7%9A%84%E5%8F%AF%E6%88%AA%E6%80%A7%E5%88%A4%E6%96%AD%EF%BC%88%E9%80%89%E9%9D%9E%E9%A2%98%EF%BC%89.md) | 截面与切割 | 保留原题 |
| 2023 | [errrc:5445923](https://github.com/ERRRC/kaogongzhentizhengliu/blob/84ab93d4b64b61d897bece8a1c0a5bab06b4feb2/10-%E7%9C%9F%E9%A2%98/%E5%88%A4%E6%96%AD%E6%8E%A8%E7%90%86/%E5%9B%BE%E5%BD%A2%E6%8E%A8%E7%90%86/5445923%20%E7%A9%BA%E9%97%B4%E9%87%8D%E6%9E%84-%E5%85%AD%E9%9D%A2%E4%BD%93%E6%8A%98%E5%8F%A0%EF%BC%88%E5%85%AC%E5%85%B1%E7%82%B9-%E5%85%AC%E5%85%B1%E8%BE%B9%E5%AE%9A%E4%BD%8D%E7%9B%B8%E9%82%BB%E9%9D%A2%EF%BC%89.md) | 折纸盒与外表面展开 | 此次新增 |
| 2023 | [errrc:5445822](https://github.com/ERRRC/kaogongzhentizhengliu/blob/84ab93d4b64b61d897bece8a1c0a5bab06b4feb2/10-%E7%9C%9F%E9%A2%98/%E5%88%A4%E6%96%AD%E6%8E%A8%E7%90%86/%E5%9B%BE%E5%BD%A2%E6%8E%A8%E7%90%86/5445822%20%E7%A9%BA%E9%97%B4%E6%8A%98%E5%8F%A0-%E6%8A%98%E7%BA%B8%E6%8A%95%E5%BD%B1%E9%9D%A2%E7%A7%AF%E8%AE%A1%E7%AE%97%EF%BC%88%E7%BF%BB%E6%8A%98%E8%A6%86%E7%9B%96%E4%B8%8E%E9%87%8D%E5%8F%A0%E5%AE%B9%E6%96%A5%EF%BC%89.md) | 平面折叠与折纸图形 | 此次新增 |
| 2023 | [errrc:5445823](https://github.com/ERRRC/kaogongzhentizhengliu/blob/84ab93d4b64b61d897bece8a1c0a5bab06b4feb2/10-%E7%9C%9F%E9%A2%98/%E5%88%A4%E6%96%AD%E6%8E%A8%E7%90%86/%E5%9B%BE%E5%BD%A2%E6%8E%A8%E7%90%86/5445823%20%E4%B8%89%E8%A7%86%E5%9B%BE-%E7%AB%8B%E4%BD%93%E5%9B%BE%E5%BD%A2%E8%A7%86%E5%9B%BE%E5%88%A4%E6%96%AD%EF%BC%88%E9%80%89%E9%9D%9E%E9%A2%98%EF%BC%89.md) | 三视图与可见棱线 | 此次新增 |
| 2024 | [errrc:5893669](https://github.com/ERRRC/kaogongzhentizhengliu/blob/84ab93d4b64b61d897bece8a1c0a5bab06b4feb2/10-%E7%9C%9F%E9%A2%98/%E5%88%A4%E6%96%AD%E6%8E%A8%E7%90%86/%E5%9B%BE%E5%BD%A2%E6%8E%A8%E7%90%86/5893669%20%E7%AB%8B%E4%BD%93%E6%8B%BC%E5%90%88%EF%BC%88%E5%A4%9A%E5%9D%97%E6%8B%BC%E5%90%88-%E5%87%B9%E5%87%B8%E4%BA%92%E8%A1%A5%2B%E7%81%B0%E8%89%B2%E5%9D%97%E9%A2%9C%E8%89%B2%E5%AF%B9%E5%BA%94%EF%BC%89.md) | 立体拼合与组合体 | 保留原题 |
| 2024 | [errrc:5894887](https://github.com/ERRRC/kaogongzhentizhengliu/blob/84ab93d4b64b61d897bece8a1c0a5bab06b4feb2/10-%E7%9C%9F%E9%A2%98/%E5%88%A4%E6%96%AD%E6%8E%A8%E7%90%86/%E5%9B%BE%E5%BD%A2%E6%8E%A8%E7%90%86/5894887%20%E7%AB%8B%E4%BD%93%E6%8B%BC%E5%90%88%EF%BC%88%E5%A4%9A%E9%9D%A2%E4%BD%93%E7%BB%84%E5%90%88%C2%B7%E5%87%B9%E5%87%B8%E4%BA%92%E8%A1%A5%EF%BC%89.md) | 立体拼合与组合体 | 此次新增 |
| 2024 | [errrc:5893673](https://github.com/ERRRC/kaogongzhentizhengliu/blob/84ab93d4b64b61d897bece8a1c0a5bab06b4feb2/10-%E7%9C%9F%E9%A2%98/%E5%88%A4%E6%96%AD%E6%8E%A8%E7%90%86/%E5%9B%BE%E5%BD%A2%E6%8E%A8%E7%90%86/5893673%20%E6%88%AA%E9%9D%A2%E5%9B%BE-%E4%B8%89%E7%82%B9%E5%AE%9A%E9%9D%A2%E7%AB%8B%E4%BD%93%E5%88%87%E5%89%B2.md) | 截面与切割 | 此次新增 |
| 2024 | [errrc:5894980](https://github.com/ERRRC/kaogongzhentizhengliu/blob/84ab93d4b64b61d897bece8a1c0a5bab06b4feb2/10-%E7%9C%9F%E9%A2%98/%E5%88%A4%E6%96%AD%E6%8E%A8%E7%90%86/%E5%9B%BE%E5%BD%A2%E6%8E%A8%E7%90%86/5894980%20%E6%88%AA%E9%9D%A2%E5%9B%BE-%E7%AB%8B%E4%BD%93%E5%88%87%E5%89%B2%EF%BC%88%E4%B8%89%E7%82%B9%E5%AE%9A%E9%9D%A2%E7%A1%AE%E5%AE%9A%E6%88%AA%E9%9D%A2%EF%BC%89.md) | 截面与切割 | 此次新增 |
| 2024 | [errrc:5893661](https://github.com/ERRRC/kaogongzhentizhengliu/blob/84ab93d4b64b61d897bece8a1c0a5bab06b4feb2/10-%E7%9C%9F%E9%A2%98/%E5%88%A4%E6%96%AD%E6%8E%A8%E7%90%86/%E5%9B%BE%E5%BD%A2%E6%8E%A8%E7%90%86/5893661%20%E7%A9%BA%E9%97%B4%E9%87%8D%E6%9E%84-%E5%A4%96%E8%A1%A8%E9%9D%A2%E5%B1%95%E5%BC%80%E5%9B%BE%EF%BC%88%E9%9D%A2%E4%B8%80%E4%B8%80%E5%AF%B9%E5%BA%94-%E6%97%A0%E4%B8%AD%E7%94%9F%E6%9C%89%E9%9D%A2%E6%8E%92%E9%99%A4%EF%BC%89.md) | 折纸盒与外表面展开 | 此次新增 |
| 2024 | [errrc:5895236](https://github.com/ERRRC/kaogongzhentizhengliu/blob/84ab93d4b64b61d897bece8a1c0a5bab06b4feb2/10-%E7%9C%9F%E9%A2%98/%E5%88%A4%E6%96%AD%E6%8E%A8%E7%90%86/%E5%9B%BE%E5%BD%A2%E6%8E%A8%E7%90%86/5895236%20%E7%A9%BA%E9%97%B4%E9%87%8D%E6%9E%84-%E9%95%BF%E6%96%B9%E4%BD%93%E5%A4%96%E8%A1%A8%E9%9D%A2%E5%B1%95%E5%BC%80%E5%9B%BE%EF%BC%88%E7%9B%B8%E9%82%BB%E9%9D%A2%E5%85%AC%E5%85%B1%E8%BE%B9%E4%B8%8E%E7%81%B0%E5%9D%97%E4%BD%8D%E7%BD%AE%E5%AF%B9%E5%BA%94%EF%BC%89.md) | 折纸盒与外表面展开 | 此次新增 |
| 2025 | [errrc:19283877](https://github.com/ERRRC/kaogongzhentizhengliu/blob/84ab93d4b64b61d897bece8a1c0a5bab06b4feb2/10-%E7%9C%9F%E9%A2%98/%E5%88%A4%E6%96%AD%E6%8E%A8%E7%90%86/%E5%9B%BE%E5%BD%A2%E6%8E%A8%E7%90%86/19283877%20%E7%AB%8B%E4%BD%93%E6%8B%BC%E5%90%88%EF%BC%88%E5%A4%9A%E7%BB%84%E4%BB%B6%E6%8B%BC%E5%90%88%C2%B7%E9%80%89%E9%9D%9E%E9%A2%98%EF%BC%89.md) | 立体拼合与组合体 | 此次新增 |
| 2025 | [errrc:19283916](https://github.com/ERRRC/kaogongzhentizhengliu/blob/84ab93d4b64b61d897bece8a1c0a5bab06b4feb2/10-%E7%9C%9F%E9%A2%98/%E5%88%A4%E6%96%AD%E6%8E%A8%E7%90%86/%E5%9B%BE%E5%BD%A2%E6%8E%A8%E7%90%86/19283916%20%E7%AB%8B%E4%BD%93%E6%8B%BC%E5%90%88%EF%BC%88%E7%BB%84%E4%BB%B6%E4%BA%92%E8%A1%A5%E6%8B%BC%E5%90%88%2B%E7%81%B0%E8%89%B2%E5%9D%97%E9%A2%9C%E8%89%B2%E5%AF%B9%E4%BD%8D%EF%BC%89.md) | 立体拼合与组合体 | 保留原题 |
| 2025 | [errrc:19283859](https://github.com/ERRRC/kaogongzhentizhengliu/blob/84ab93d4b64b61d897bece8a1c0a5bab06b4feb2/10-%E7%9C%9F%E9%A2%98/%E5%88%A4%E6%96%AD%E6%8E%A8%E7%90%86/%E5%9B%BE%E5%BD%A2%E6%8E%A8%E7%90%86/19283859%20%E6%88%AA%E9%9D%A2%E5%9B%BE%EF%BC%88%E7%AB%8B%E4%BD%93%E5%88%87%E5%89%B2%E2%80%94%E2%80%94%E4%B8%89%E7%82%B9%E5%AE%9A%E9%9D%A2%EF%BC%89.md) | 截面与切割 | 此次新增 |
| 2025 | [errrc:19283965](https://github.com/ERRRC/kaogongzhentizhengliu/blob/84ab93d4b64b61d897bece8a1c0a5bab06b4feb2/10-%E7%9C%9F%E9%A2%98/%E5%88%A4%E6%96%AD%E6%8E%A8%E7%90%86/%E5%9B%BE%E5%BD%A2%E6%8E%A8%E7%90%86/19283965%20%E5%9B%BE%E5%BD%A2%E6%8E%A8%E7%90%86-%E6%88%AA%E9%9D%A2%E5%9B%BE%EF%BC%88%E7%AB%8B%E4%BD%93%E5%88%87%E5%89%B2%C2%B7%E4%B8%89%E7%82%B9%E5%AE%9A%E9%9D%A2%EF%BC%89.md) | 截面与切割 | 此次新增 |
| 2025 | [errrc:19283845](https://github.com/ERRRC/kaogongzhentizhengliu/blob/84ab93d4b64b61d897bece8a1c0a5bab06b4feb2/10-%E7%9C%9F%E9%A2%98/%E5%88%A4%E6%96%AD%E6%8E%A8%E7%90%86/%E5%9B%BE%E5%BD%A2%E6%8E%A8%E7%90%86/19283845%20%E7%A9%BA%E9%97%B4%E9%87%8D%E6%9E%84-%E5%85%AD%E9%9D%A2%E4%BD%93%E5%B1%95%E5%BC%80%E5%9B%BE%E6%8A%98%E5%8F%A0%E4%B8%80%E8%87%B4%E6%80%A7%EF%BC%88%E7%89%B9%E5%BE%81%E9%9D%A2%E5%AD%97%E6%AF%8D%E6%9C%9D%E5%90%91%2B%E7%9B%B8%E9%82%BB%E9%9D%A2%E5%85%B3%E7%B3%BB%EF%BC%89.md) | 折纸盒与外表面展开 | 保留原题 |
| 2025 | [errrc:19283952](https://github.com/ERRRC/kaogongzhentizhengliu/blob/84ab93d4b64b61d897bece8a1c0a5bab06b4feb2/10-%E7%9C%9F%E9%A2%98/%E5%88%A4%E6%96%AD%E6%8E%A8%E7%90%86/%E5%9B%BE%E5%BD%A2%E6%8E%A8%E7%90%86/19283952%20%E7%A9%BA%E9%97%B4%E9%87%8D%E6%9E%84-%E5%A4%96%E8%A1%A8%E9%9D%A2%E5%B1%95%E5%BC%80%E5%9B%BE%EF%BC%88%E5%85%AC%E5%85%B1%E8%BE%B9%E6%B3%95%EF%BC%89.md) | 折纸盒与外表面展开 | 此次新增 |
| 2026 | [errrc:19526323](https://github.com/ERRRC/kaogongzhentizhengliu/blob/84ab93d4b64b61d897bece8a1c0a5bab06b4feb2/10-%E7%9C%9F%E9%A2%98/%E5%88%A4%E6%96%AD%E6%8E%A8%E7%90%86/%E5%9B%BE%E5%BD%A2%E6%8E%A8%E7%90%86/19526323%20%E7%AB%8B%E4%BD%93%E6%8B%BC%E5%90%88%EF%BC%88%E5%A4%9A%E5%9D%97%E7%BB%84%E5%90%88%C2%B7%E9%80%89%E9%9D%9E%E5%9E%8B%EF%BC%89.md) | 立体拼合与组合体 | 保留原题 |
| 2026 | [errrc:19526428](https://github.com/ERRRC/kaogongzhentizhengliu/blob/84ab93d4b64b61d897bece8a1c0a5bab06b4feb2/10-%E7%9C%9F%E9%A2%98/%E5%88%A4%E6%96%AD%E6%8E%A8%E7%90%86/%E5%9B%BE%E5%BD%A2%E6%8E%A8%E7%90%86/19526428%20%E7%AB%8B%E4%BD%93%E6%8B%BC%E5%90%88%EF%BC%88%E5%A4%9A%E5%9D%97%E6%8B%BC%E5%90%88%C2%B7%E9%80%89%E9%9D%9E%E9%A2%98%EF%BC%89.md) | 立体拼合与组合体 | 保留原题 |
| 2026 | [errrc:19526333](https://github.com/ERRRC/kaogongzhentizhengliu/blob/84ab93d4b64b61d897bece8a1c0a5bab06b4feb2/10-%E7%9C%9F%E9%A2%98/%E5%88%A4%E6%96%AD%E6%8E%A8%E7%90%86/%E5%9B%BE%E5%BD%A2%E6%8E%A8%E7%90%86/19526333%20%E6%88%AA%E9%9D%A2%E5%9B%BE%EF%BC%88%E7%AB%8B%E4%BD%93%E5%88%87%E5%89%B2%E2%80%94%E4%B8%89%E7%82%B9%E5%AE%9A%E9%9D%A2%EF%BC%89.md) | 截面与切割 | 保留原题 |
| 2026 | [errrc:19526329](https://github.com/ERRRC/kaogongzhentizhengliu/blob/84ab93d4b64b61d897bece8a1c0a5bab06b4feb2/10-%E7%9C%9F%E9%A2%98/%E5%88%A4%E6%96%AD%E6%8E%A8%E7%90%86/%E5%9B%BE%E5%BD%A2%E6%8E%A8%E7%90%86/19526329%20%E7%A9%BA%E9%97%B4%E9%87%8D%E6%9E%84-%E5%B1%95%E5%BC%80%E5%9B%BE%E4%B8%8E%E7%AB%8B%E4%BD%93%E5%9B%BE%E5%AF%B9%E5%BA%94%EF%BC%88%E7%89%B9%E5%BE%81%E9%9D%A2%E6%8F%8F%E8%BE%B9%E6%A0%87%E5%8F%B7%E5%8C%B9%E9%85%8D%E5%85%AC%E5%85%B1%E8%BE%B9%EF%BC%89.md) | 折纸盒与外表面展开 | 此次新增 |
| 2026 | [errrc:19526393](https://github.com/ERRRC/kaogongzhentizhengliu/blob/84ab93d4b64b61d897bece8a1c0a5bab06b4feb2/10-%E7%9C%9F%E9%A2%98/%E5%88%A4%E6%96%AD%E6%8E%A8%E7%90%86/%E5%9B%BE%E5%BD%A2%E6%8E%A8%E7%90%86/19526393%20%E7%A9%BA%E9%97%B4%E9%87%8D%E6%9E%84-%E5%85%AD%E9%9D%A2%E4%BD%93%E5%B1%95%E5%BC%80%E5%9B%BE%E6%8A%98%E5%8F%A0%EF%BC%88%E7%9B%B8%E5%AF%B9%E9%9D%A2%E6%8E%92%E9%99%A4%EF%BC%8B%E7%9B%B8%E9%82%BB%E9%9D%A2%E5%85%AC%E5%85%B1%E7%82%B9%E7%BB%86%E8%8A%82%E5%88%A4%E5%AE%9A%EF%BC%89.md) | 折纸盒与外表面展开 | 保留原题 |
| 2026 | [errrc:19526397](https://github.com/ERRRC/kaogongzhentizhengliu/blob/84ab93d4b64b61d897bece8a1c0a5bab06b4feb2/10-%E7%9C%9F%E9%A2%98/%E5%88%A4%E6%96%AD%E6%8E%A8%E7%90%86/%E5%9B%BE%E5%BD%A2%E6%8E%A8%E7%90%86/19526397%20%E7%A9%BA%E9%97%B4%E9%87%8D%E6%9E%84-%E4%B8%89%E8%A7%86%E5%9B%BE%EF%BC%88%E5%90%AB%E9%BB%91%E7%99%BD%E6%96%B9%E5%9D%97%E7%9A%84%E8%A7%86%E5%9B%BE%E6%8A%95%E5%BD%B1%E5%88%A4%E5%AE%9A%EF%BC%89.md) | 三视图与可见棱线 | 此次新增 |

## 训练与测验补充

- 真题实训新增“空间推理专项训练”入口，五类分别进入练习或限时测验。
- 原创训练组成 10 组例题与独立变式，配有三阶提示、知识点、图例与参考解析。原有错题、首答与提示记录继续使用稳定题号和版本。
- 测验支持专题/五类混合、国考回忆题/原创题/混合来源及题量与时限选择。题量不足时显示实际题数；优先抽取训练与测验都未见过的题，明确标注已练和复测。
- 图片先完整载入，再开始计时；载入失败可重试。交卷前不展示提示、解析或 3D 入口；支持回看、改答、题卡跳转和图片放大。
- 到时自动交卷，未答题计错，结果显示得分、单题耗时、首测/复测与参考解析。交卷及退出使用页面内确认，确认期间计时继续；耗时最多累计到考试截止时间。
- 测验历史独立保存在本浏览器，最多保留 20 场，重复题集合单独保留；不会改写练习首答、提示、错因或错题队列。目前练习备份 JSON 不包含测验历史，测验也不会自动将错题加入练习队列。

建议一个月冲刺时，每次先做一场不看提示的混合测验，定位错误题型，再练对应原创例题与变式，之后按周复测。真题数量较少的平面折叠、三视图应结合原创题使用；复测分数必须结合重复题标记判断，不能直接当作真实提分证据。此次没有用用户数据验证“一个月提升多少分”。

## 验证与保留边界

可重跑：

```bash
npm run test:spatial
npm run build
npm run lint
```

`test:spatial` 验证原题与新增数据共 81 道外部题、168 次有效图片引用，所有选项/答案/题号/版本/清单一致性，以及 29 道国考题与 15 卷 45 次出现的映射。原创内容独立计算验证：枚举 35 种自由六连方得到恰好 11 种合法正方体展开图；核对投影轮廓、方块计数上下界、黑白约束、折叠面积与层序、24 种正旋转与镜像区分、空心截面面积等。

存储测试验证：练习首答与提示记录不因测验而改变；测验历史截断到 20 场后仍保留旧题复测标记；清除测验记录不清除练习。

浏览器验收使用独立的本地测试来源，完成专题练习、例题/变式互跳、图像放大、桌面与 390×844 手机布局、倒计时自动交卷、错答与漏答计分、页面内确认、复测标记与历史恢复。练习一次、测验多次后，练习档案仍显示累计作答 1、首次独立答对 1、提示答对 0、错题待练 0。

构建与专项验证通过。Lint 无错误，保留原有 10 项警告；生产构建仍有大于 500 kB 的分块提醒，未据此宣称完成性能优化。

回忆题的答案和解析按照公开整理材料收录，并未逐题完成独立命题专家复核；上游可能存在回忆或解析错误。所选 15 卷可以证明本次回忆版本的题型覆盖，不能代替官方原卷，也不能证明所有省考/未来国考知识点穷尽。源解析笔记及第三方题图的授权边界见 [数据声明](../public/data/errrc/README.md)。
