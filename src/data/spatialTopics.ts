import type { ExamQuestion } from './examQuestions';

export type SpatialCategory = Extract<
  ExamQuestion['category'],
  'origami' | 'assembly' | 'cross_section' | 'views' | 'paper_folding'
>;

export interface SpatialTopic {
  category: SpatialCategory;
  title: string;
  focus: string[];
  examScope: string;
}

export function isRecentNationalSpatialExam(item: { isRealExam?: boolean; region?: string; year?: string }): boolean {
  const year = Number(item.year);
  return item.isRealExam === true && item.region === '国考' && Number.isInteger(year) && year >= 2022 && year <= 2026;
}

/** The five spatial-reasoning families observed in recent national-exam questions. */
export const SPATIAL_TOPICS: SpatialTopic[] = [
  {
    category: 'origami',
    title: '折纸盒与外表面展开',
    focus: ['正方体 11 种合法展开构型', '长方体面尺寸、相对面与相邻面', '公共边和公共顶点的朝向、灰块方向'],
    examScope: '空间想象：由展开图还原立体结构、面间关系和表面图案。',
  },
  {
    category: 'assembly',
    title: '立体拼合与组合体',
    focus: ['凹凸互补与数量守恒', '颜色、多个组件与小立体还原', '旋转可以重合，镜像不能混同'],
    examScope: '空间想象：拼合、拆分和组合后的立体结构判断。',
  },
  {
    category: 'cross_section',
    title: '截面与切割',
    focus: ['三点定面与切面边界', '截面形状和可截性', '空心、挖空及复合立体'],
    examScope: '空间想象：从不同方向观察或切割立体，判断截面形状。',
  },
  {
    category: 'views',
    title: '三视图与可见棱线',
    focus: ['主视、俯视和侧视投影', '遮挡关系与可见棱线', '黑白格、数量和视图约束反推立体'],
    examScope: '空间想象：由投影、视图及可见线索还原空间结构。',
  },
  {
    category: 'paper_folding',
    title: '平面折叠与折纸图形',
    focus: ['折叠层次与重合覆盖', '折痕、角点和位置对应', '展开前后面积与投影关系'],
    examScope: '空间想象：判断平面图形折叠后的形态、位置和覆盖关系。',
  },
];

export const SPATIAL_CATEGORY_LABELS: Record<SpatialCategory, string> = Object.fromEntries(
  SPATIAL_TOPICS.map((topic) => [topic.category, topic.title])
) as Record<SpatialCategory, string>;
