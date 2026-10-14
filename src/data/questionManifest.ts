import type { QuestionTrack } from './examQuestions';
import { EXAM_QUESTIONS } from './examQuestions';
import { SPATIAL_SUPPLEMENT_MANIFEST } from './spatialQuestionManifest';

export type QuestionPackId = 'builtin' | 'errrc_origami' | 'errrc_assembly' | 'errrc_cross_section' | 'errrc_guokao_spatial' | 'spatial_training';

export interface QuestionManifestItem {
  id: string;
  version: number;
  packId: QuestionPackId;
  track: QuestionTrack;
  category: 'unfold' | 'revolution' | 'cross_section' | 'origami' | 'assembly' | 'views' | 'paper_folding' | 'engineering' | 'tools';
  subType: string;
  title: string;
  source: string;
  year?: string;
  region?: string;
  difficulty?: '易' | '中' | '难';
  isRealExam?: boolean;
  hasSimulator?: boolean;
}

// Upstream metadata for the curated real exam pack
export const ERRRC_UPSTREAM_META = {
  repo: 'https://github.com/ERRRC/kaogongzhentizhengliu',
  revision: '84ab93d4b64b61d897bece8a1c0a5bab06b4feb2',
  totalQuestions: 40,
  generatedAt: '2026-09-17'
};

// Built-in question manifest entries (15 items)
const BUILTIN_MANIFEST: QuestionManifestItem[] = EXAM_QUESTIONS.map((q) => ({
  id: q.id,
  version: q.version || 1,
  packId: 'builtin',
  track: q.track,
  category: q.category,
  subType: q.subType,
  title: q.title,
  source: q.source,
  difficulty: q.difficulty,
  isRealExam: false,
  hasSimulator: Boolean(q.simulatorConfig)
}));

// Curated real exam question manifest entries (40 items)
const ERRRC_MANIFEST: QuestionManifestItem[] = [
  {
    "id": "errrc:10975257",
    "version": 1,
    "packId": "errrc_origami",
    "track": "geometry",
    "category": "origami",
    "subType": "空间重构-正方体折纸盒-相对面判定与公共顶点",
    "title": "2024江苏 · 相对面判定与公共顶点",
    "source": "2024年江苏省公务员录用考试《行测》题（A类）（网友回忆版）",
    "year": "2024",
    "region": "江苏",
    "isRealExam": true,
    "hasSimulator": true
  },
  {
    "id": "errrc:17056533",
    "version": 1,
    "packId": "errrc_origami",
    "track": "geometry",
    "category": "origami",
    "subType": "空间重构-六面体展开图还原",
    "title": "2026上海 · 黑块贴棱关系判定）",
    "source": "2026年上海市公务员录用考试《行测》题（网友回忆版）",
    "year": "2026",
    "region": "上海",
    "isRealExam": true,
    "hasSimulator": true
  },
  {
    "id": "errrc:12019707",
    "version": 1,
    "packId": "errrc_origami",
    "track": "geometry",
    "category": "origami",
    "subType": "空间折叠",
    "title": "2026广东 · 公共点引线法",
    "source": "2026年广东省公务员录用考试《行测》题（网友回忆版）",
    "year": "2026",
    "region": "广东",
    "isRealExam": true,
    "hasSimulator": true
  },
  {
    "id": "errrc:17056531",
    "version": 1,
    "packId": "errrc_origami",
    "track": "geometry",
    "category": "origami",
    "subType": "空间重构-六面体折纸盒",
    "title": "2026上海 · 画边法定位相邻面）",
    "source": "2026年上海市公务员录用考试《行测》题（网友回忆版）",
    "year": "2026",
    "region": "上海",
    "isRealExam": true,
    "hasSimulator": true
  },
  {
    "id": "errrc:2367814",
    "version": 1,
    "packId": "errrc_origami",
    "track": "geometry",
    "category": "origami",
    "subType": "空间重构-四面体折叠",
    "title": "2019江苏 · 箭头指向检验）",
    "source": "2019年江苏省公务员录用考试《行测》题（B类）（网友回忆版）",
    "year": "2019",
    "region": "江苏",
    "isRealExam": true,
    "hasSimulator": true
  },
  {
    "id": "errrc:12536558",
    "version": 1,
    "packId": "errrc_origami",
    "track": "geometry",
    "category": "origami",
    "subType": "空间重构-立体图形的平面展开图识别",
    "title": "2024深圳市考 · 四面体展开图）",
    "source": "2024年深圳市考公务员录用考试《行测》试题（网友回忆版）",
    "year": "2024",
    "region": "深圳市考",
    "isRealExam": true,
    "hasSimulator": true
  },
  {
    "id": "errrc:19526393",
    "version": 1,
    "packId": "errrc_origami",
    "track": "geometry",
    "category": "origami",
    "subType": "空间重构-六面体展开图折叠",
    "title": "2026国考 · 六面体展开图折叠",
    "source": "2026年国家公务员录用考试《行测》题（地市级网友回忆版）",
    "year": "2026",
    "region": "国考",
    "isRealExam": true,
    "hasSimulator": true
  },
  {
    "id": "errrc:16070182",
    "version": 1,
    "packId": "errrc_origami",
    "track": "geometry",
    "category": "origami",
    "subType": "空间重构-六面体展开图折叠",
    "title": "2026湖北 · 六面体展开图折叠",
    "source": "2026年湖北省公务员录用考试《行测》题（网友回忆版）",
    "year": "2026",
    "region": "湖北",
    "isRealExam": true,
    "hasSimulator": true
  },
  {
    "id": "errrc:18650003",
    "version": 1,
    "packId": "errrc_origami",
    "track": "geometry",
    "category": "origami",
    "subType": "空间重构-六面体折叠",
    "title": "2025选调 · 六面体折叠",
    "source": "2025年重庆市定向选调优秀大学生到基层工作考试《行测》题",
    "year": "2025",
    "region": "选调",
    "isRealExam": true,
    "hasSimulator": true
  },
  {
    "id": "errrc:11367779",
    "version": 1,
    "packId": "errrc_origami",
    "track": "geometry",
    "category": "origami",
    "subType": "空间重构-六面体折叠",
    "title": "2025江苏 · 六面体折叠",
    "source": "2025年江苏省公务员录用考试《行测》题（A类）（网友回忆版）",
    "year": "2025",
    "region": "江苏",
    "isRealExam": true,
    "hasSimulator": true
  },
  {
    "id": "errrc:15419026",
    "version": 1,
    "packId": "errrc_origami",
    "track": "geometry",
    "category": "origami",
    "subType": "六面体展开图-展开图等同性判定",
    "title": "2025湖北 · 时针方向法）",
    "source": "2025年湖北省选调生招录考试综合知识和行政职业能力测验试卷（网友回忆版）",
    "year": "2025",
    "region": "湖北",
    "isRealExam": true,
    "hasSimulator": true
  },
  {
    "id": "errrc:12882220",
    "version": 1,
    "packId": "errrc_origami",
    "track": "geometry",
    "category": "origami",
    "subType": "空间重构-六面体折纸盒",
    "title": "2025内蒙古 · 六面体折纸盒",
    "source": "2025年内蒙古公务员录用考试《行测》题（网友回忆版）",
    "year": "2025",
    "region": "内蒙古",
    "isRealExam": true,
    "hasSimulator": true
  },
  {
    "id": "errrc:12101006",
    "version": 1,
    "packId": "errrc_origami",
    "track": "geometry",
    "category": "origami",
    "subType": "空间重构-六面体折叠",
    "title": "2025江苏 · 公共边定位法）",
    "source": "2025年江苏省公务员录用考试《行测》题（B类）（网友回忆版）",
    "year": "2025",
    "region": "江苏",
    "isRealExam": true,
    "hasSimulator": true
  },
  {
    "id": "errrc:12101001",
    "version": 1,
    "packId": "errrc_origami",
    "track": "geometry",
    "category": "origami",
    "subType": "空间重构-六面体折叠",
    "title": "2025江苏 · 公共边贴线特征）",
    "source": "2025年江苏省公务员录用考试《行测》题（C类）（网友回忆版）",
    "year": "2025",
    "region": "江苏",
    "isRealExam": true,
    "hasSimulator": true
  },
  {
    "id": "errrc:19283845",
    "version": 1,
    "packId": "errrc_origami",
    "track": "geometry",
    "category": "origami",
    "subType": "空间重构-六面体展开图折叠一致性",
    "title": "2025国考 · 六面体展开图折叠一致性",
    "source": "2025年国家公务员录用考试《行测》题（行政执法卷网友回忆版）",
    "year": "2025",
    "region": "国考",
    "isRealExam": true,
    "hasSimulator": true
  },
  {
    "id": "errrc:17097750",
    "version": 1,
    "packId": "errrc_origami",
    "track": "geometry",
    "category": "origami",
    "subType": "空间重构-相对面关系",
    "title": "2024山西 · 相对面关系",
    "source": "2024年山西省县级纪委监委公务员录用考试《行测》题（网友回忆版）",
    "year": "2024",
    "region": "山西",
    "isRealExam": true,
    "hasSimulator": true
  },
  {
    "id": "errrc:10204640",
    "version": 1,
    "packId": "errrc_assembly",
    "track": "geometry",
    "category": "assembly",
    "subType": "立体拼合",
    "title": "2024河南 · 立体拼合",
    "source": "2024年河南省公务员录用考试《行测》题（网友回忆版）",
    "year": "2024",
    "region": "河南",
    "isRealExam": true,
    "hasSimulator": true
  },
  {
    "id": "errrc:13504506",
    "version": 1,
    "packId": "errrc_assembly",
    "track": "geometry",
    "category": "assembly",
    "subType": "立体拼合",
    "title": "2025河北 · 凹凸互补）",
    "source": "2025年河北省公务员录用考试《行测》题（网友回忆版）",
    "year": "2025",
    "region": "河北",
    "isRealExam": true,
    "hasSimulator": true
  },
  {
    "id": "errrc:12019797",
    "version": 1,
    "packId": "errrc_assembly",
    "track": "geometry",
    "category": "assembly",
    "subType": "立体拼合-由两视图及全等小块反推小立体",
    "title": "2026浙江 · 由两视图及全等小块反推小立体",
    "source": "2026年浙江省公务员录用考试《行测》题（C类）（网友回忆版）",
    "year": "2026",
    "region": "浙江",
    "isRealExam": true,
    "hasSimulator": true
  },
  {
    "id": "errrc:16593237",
    "version": 1,
    "packId": "errrc_assembly",
    "track": "geometry",
    "category": "assembly",
    "subType": "立体拼合-数量守恒",
    "title": "2024广东 · 数量守恒",
    "source": "2024年广东省公务员录用考试《行测》题（网友回忆版）",
    "year": "2024",
    "region": "广东",
    "isRealExam": true,
    "hasSimulator": true
  },
  {
    "id": "errrc:13504321",
    "version": 1,
    "packId": "errrc_assembly",
    "track": "geometry",
    "category": "assembly",
    "subType": "立体拼合-多面体组合",
    "title": "2025云南 · 多面体组合",
    "source": "2025年云南省公务员录用考试《行测》题（网友回忆版）",
    "year": "2025",
    "region": "云南",
    "isRealExam": true,
    "hasSimulator": true
  },
  {
    "id": "errrc:10297423",
    "version": 1,
    "packId": "errrc_assembly",
    "track": "geometry",
    "category": "assembly",
    "subType": "图形推理-立体拼合",
    "title": "2025四川 · 立体拼合",
    "source": "2025年四川省考/选调公务员录用考试《行测》试题（网友回忆版）",
    "year": "2025",
    "region": "四川",
    "isRealExam": true,
    "hasSimulator": true
  },
  {
    "id": "errrc:16070184",
    "version": 1,
    "packId": "errrc_assembly",
    "track": "geometry",
    "category": "assembly",
    "subType": "立体拼合",
    "title": "2026湖北 · 立体拼合",
    "source": "2026年湖北省公务员录用考试《行测》题（网友回忆版）",
    "year": "2026",
    "region": "湖北",
    "isRealExam": true,
    "hasSimulator": true
  },
  {
    "id": "errrc:19526428",
    "version": 1,
    "packId": "errrc_assembly",
    "track": "geometry",
    "category": "assembly",
    "subType": "立体拼合",
    "title": "2026国考 · 立体拼合",
    "source": "2026年国家公务员录用考试《行测》题（副省级网友回忆版）",
    "year": "2026",
    "region": "国考",
    "isRealExam": true,
    "hasSimulator": true
  },
  {
    "id": "errrc:19526323",
    "version": 1,
    "packId": "errrc_assembly",
    "track": "geometry",
    "category": "assembly",
    "subType": "立体拼合",
    "title": "2026国考 · 立体拼合",
    "source": "2026年国家公务员录用考试《行测》题（地市级网友回忆版）",
    "year": "2026",
    "region": "国考",
    "isRealExam": true,
    "hasSimulator": true
  },
  {
    "id": "errrc:18643993",
    "version": 1,
    "packId": "errrc_assembly",
    "track": "geometry",
    "category": "assembly",
    "subType": "立体拼合-相同小单元",
    "title": "2026广东 · 相同小单元",
    "source": "2026年广东省公务员录用考试《行测》题（网友回忆版）",
    "year": "2026",
    "region": "广东",
    "isRealExam": true,
    "hasSimulator": true
  },
  {
    "id": "errrc:19283916",
    "version": 1,
    "packId": "errrc_assembly",
    "track": "geometry",
    "category": "assembly",
    "subType": "立体拼合",
    "title": "2025国考 · 立体拼合",
    "source": "2025年国家公务员录用考试《行测》题（地市级网友回忆版）",
    "year": "2025",
    "region": "国考",
    "isRealExam": true,
    "hasSimulator": true
  },
  {
    "id": "errrc:3523525",
    "version": 1,
    "packId": "errrc_assembly",
    "track": "geometry",
    "category": "assembly",
    "subType": "立体拼合",
    "title": "2021甘肃 · 立体拼合",
    "source": "2021年甘肃公务员录用考试《行测》题（网友回忆版）",
    "year": "2021",
    "region": "甘肃",
    "isRealExam": true,
    "hasSimulator": true
  },
  {
    "id": "errrc:4818019",
    "version": 1,
    "packId": "errrc_assembly",
    "track": "geometry",
    "category": "assembly",
    "subType": "立体拼合",
    "title": "2022四川 · 立体拼合",
    "source": "2022年四川省公务员录用考试《行测》题（网友回忆版）",
    "year": "2022",
    "region": "四川",
    "isRealExam": true,
    "hasSimulator": true
  },
  {
    "id": "errrc:5893669",
    "version": 1,
    "packId": "errrc_assembly",
    "track": "geometry",
    "category": "assembly",
    "subType": "立体拼合",
    "title": "2024国考 · 凹凸互补+灰色块颜色对应）",
    "source": "2024年国家公务员录用考试《行测》题（行政执法卷网友回忆版）",
    "year": "2024",
    "region": "国考",
    "isRealExam": true,
    "hasSimulator": true
  },
  {
    "id": "errrc:15833785",
    "version": 1,
    "packId": "errrc_cross_section",
    "track": "geometry",
    "category": "cross_section",
    "subType": "截面图-正方体组合体截切",
    "title": "2026内蒙古 · 正方体组合体截切",
    "source": "2026年内蒙古公务员录用考试《行测》题（网友回忆版）",
    "year": "2026",
    "region": "内蒙古",
    "isRealExam": true,
    "hasSimulator": true
  },
  {
    "id": "errrc:5445843",
    "version": 1,
    "packId": "errrc_cross_section",
    "track": "geometry",
    "category": "cross_section",
    "subType": "截面图-圆柱组合体挖空截面的可截性判断",
    "title": "2023国考 · 圆柱组合体挖空截面的可截性判断",
    "source": "2023年国家公务员录用考试《行测》题（副省级网友回忆版）",
    "year": "2023",
    "region": "国考",
    "isRealExam": true,
    "hasSimulator": true
  },
  {
    "id": "errrc:2742190",
    "version": 1,
    "packId": "errrc_cross_section",
    "track": "geometry",
    "category": "cross_section",
    "subType": "截面图-圆锥组合体",
    "title": "2021江苏 · 圆锥组合体",
    "source": "2021年江苏省公务员录用考试《行测》题（B类）（网友回忆版）",
    "year": "2021",
    "region": "江苏",
    "isRealExam": true,
    "hasSimulator": true
  },
  {
    "id": "errrc:2367993",
    "version": 1,
    "packId": "errrc_cross_section",
    "track": "geometry",
    "category": "cross_section",
    "subType": "立体截面图-空心贯穿体",
    "title": "2019江苏 · 空心贯穿体",
    "source": "2019年江苏省公务员录用考试《行测》题（C类）（网友回忆版）",
    "year": "2019",
    "region": "江苏",
    "isRealExam": true,
    "hasSimulator": true
  },
  {
    "id": "errrc:2444725",
    "version": 1,
    "packId": "errrc_cross_section",
    "track": "geometry",
    "category": "cross_section",
    "subType": "截面图-正方体组合体的剖切面截取",
    "title": "2019四川 · 正方体组合体的剖切面截取",
    "source": "2019年四川省公务员录用考试《行测》题（下半年）（网友回忆版）",
    "year": "2019",
    "region": "四川",
    "isRealExam": true,
    "hasSimulator": true
  },
  {
    "id": "errrc:5430887",
    "version": 1,
    "packId": "errrc_cross_section",
    "track": "geometry",
    "category": "cross_section",
    "subType": "立体图形-截面图",
    "title": "2023浙江 · 截面图",
    "source": "2023年浙江省公务员录用考试《行测》题（C类）（网友回忆版）",
    "year": "2023",
    "region": "浙江",
    "isRealExam": true,
    "hasSimulator": true
  },
  {
    "id": "errrc:15833801",
    "version": 1,
    "packId": "errrc_cross_section",
    "track": "geometry",
    "category": "cross_section",
    "subType": "立体截面图",
    "title": "2026广西 · 立体截面图",
    "source": "2026年广西区考公务员录用考试《行测》题（网友回忆版）",
    "year": "2026",
    "region": "广西",
    "isRealExam": true,
    "hasSimulator": true
  },
  {
    "id": "errrc:19526333",
    "version": 1,
    "packId": "errrc_cross_section",
    "track": "geometry",
    "category": "cross_section",
    "subType": "截面图",
    "title": "2026国考 · 截面图",
    "source": "2026年国家公务员录用考试《行测》题（行政执法卷网友回忆版）",
    "year": "2026",
    "region": "国考",
    "isRealExam": true,
    "hasSimulator": true
  },
  {
    "id": "errrc:18649985",
    "version": 1,
    "packId": "errrc_cross_section",
    "track": "geometry",
    "category": "cross_section",
    "subType": "截面图",
    "title": "2025选调 · 三点定面）",
    "source": "2025年重庆市定向选调优秀大学生到基层工作考试《行测》题",
    "year": "2025",
    "region": "选调",
    "isRealExam": true,
    "hasSimulator": true
  },
  {
    "id": "errrc:13504539",
    "version": 1,
    "packId": "errrc_cross_section",
    "track": "geometry",
    "category": "cross_section",
    "subType": "立体截面图",
    "title": "2025甘肃 · 立体截面图",
    "source": "2025年甘肃公务员录用考试《行测》题（网友回忆版）",
    "year": "2025",
    "region": "甘肃",
    "isRealExam": true,
    "hasSimulator": true
  }
];

// Metadata only: full question packs and diagrams remain lazy-loaded.
export const QUESTION_MANIFEST: QuestionManifestItem[] = [
  ...BUILTIN_MANIFEST,
  ...ERRRC_MANIFEST,
  ...SPATIAL_SUPPLEMENT_MANIFEST
];

// Global mapping of question versions for review queue and version check
export const GLOBAL_QUESTION_VERSIONS: Record<string, number> = Object.fromEntries(
  QUESTION_MANIFEST.map((q) => [q.id, q.version])
);

export const MANIFEST_BY_ID = new Map<string, QuestionManifestItem>(
  QUESTION_MANIFEST.map((q) => [q.id, q])
);

export function getManifestItem(id: string): QuestionManifestItem | undefined {
  return MANIFEST_BY_ID.get(id);
}
