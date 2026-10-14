# 空间真题精选包 (Spatial Exam Question Curated Pack)

本目录包含从公考真题整理库离线提取并清洗规范的空间推理真题切片数据与必要图例。

## 1. 数据来源与版本核查 (Upstream Provenance)
- 题目与图例来源：[ERRRC/kaogongzhentizhengliu](https://github.com/ERRRC/kaogongzhentizhengliu)
  - 核查与锁定 Commit SHA: `84ab93d4b64b61d897bece8a1c0a5bab06b4feb2`
  - 提取分类：
    - 折纸盒与六面体/四面体空间重构 (`origami.json`，16题)
    - 立体拼合与正方体堆叠组合 (`assembly.json`，14题)
    - 立体截面与剖切图形 (`cross_section.json`，10题)
  - 原精选包：40 道题，实际引用图片 97 张。
  - 2026-10-14 追加 `guokao_spatial_2022_2026.json`：21 道原精选包缺少的近五年国考回忆题，与原有 8 道合计 29 道去重国考空间题。
  - 15 份公开整卷回忆 PDF、45 次题目出现及来源哈希记录于 `guokao_spatial_papers.json`；覆盖库存与是否新增记录于 `guokao_spatial_audit.json`。题号只对应链接中的回忆版本。
  - 原创专项训练另存于 `../spatial/training.json`（20 道，明确标为非国考真题）。运行时与外部数据清单合计 81 道题，包含上述原创题。核查详情见 [空间专项覆盖报告](../../../docs/spatial-coverage-2022-2026.md)。
- 交互与逻辑参考：[ERRRC/kaogong-shuati](https://github.com/ERRRC/kaogong-shuati)
  - 核查 Commit SHA: `a161ae62d16bf97dfdcf7a4de3bf6ea1a146d25a`

## 2. 授权与版权声明 (License & Attribution)
- **解析笔记与解题技巧整理**：依据上游原仓库声明采用 **CC BY-NC 4.0**（知识共享 署名-非商业性使用 4.0 国际许可协议）。
- **题干内容与真题图例**：题干、图形及试卷题目属于第三方公考命题机构或考生网友回忆版本，版权归原作者或机构所有。本项目未宣称获得任何再分发授权，仅在本地教学辅助、离线学习与学术/个人研析范畴内使用，禁止用于商业分发。
- **本系统刷题与教学代码**：遵循 MIT License。

## 3. 数据规范与离线转换说明
1. 题号采用稳定前缀规范：`errrc:<qid>`（如 `errrc:10975257`、`errrc:10204640`）。
2. 每道题目完整保存原始出处试卷名称、年份、地区及上游 Revision。
3. 选项已去除原始 MarkDown 中的 `✅` 答案标记，题干清洗并去除泄题隐患。
4. 所有引用的题干图与解析图均核验存在且本地化，严格杜绝悬空链接或死链。
5. 3D 演练链接严格标明为“相关考点演示”，不冒充原题精确 3D 模型。
