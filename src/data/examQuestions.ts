export interface ExamQuestion {
  id: string;
  source: string; // e.g. "国考经典题型改编"
  title: string;
  category: 'unfold' | 'revolution' | 'cross_section' | 'origami' | 'assembly';
  subType: string;
  questionText: string;
  diagramType?: 'origami-q7' | 'assembly-q8';
  options: { key: string; text: string }[];
  correctAnswer: string;
  difficulty: '易' | '中' | '难';
  commonTraps: string;
  fastTrick: string; // 核心解题规律
  detailedAnalysis: string;
  mathFormula: string;
  simulatorConfig: {
    tab: 'unfold' | 'revolution' | 'cross_section' | 'origami' | 'assembly';
    mode?: string;
    params?: Record<string, number | string | boolean>;
  };
}

export const EXAM_QUESTIONS: ExamQuestion[] = [
  {
    id: 'q1',
    source: '联考数量关系经典题型改编',
    title: '圆柱表面蚂蚁爬行最短路径',
    category: 'unfold',
    subType: '圆柱展开',
    questionText: '一个圆柱形油罐，底面周长为 12 米，高为 5 米。一只壁虎在油罐底部外壁的 A 点，发现顶部外壁正对面的 B 点有一只苍蝇。壁虎想要吃到苍蝇，沿油罐表面爬行的最短距离是多少米？',
    options: [
      { key: 'A', text: '13 米' },
      { key: 'B', text: '5 米' },
      { key: 'C', text: '12 米' },
      { key: 'D', text: '√61 米' }
    ],
    correctAnswer: 'D',
    difficulty: '中',
    commonTraps: '极容易误以为是走“整圈”（横向 12 米，勾股 5-12-13 选 A）。注意题目说的是“正对面”，也就是只走侧面半圈，横向距离是周长的一半（12÷2=6 米）！',
    fastTrick: '【展开定两点，勾股求斜边】正对面 ⟹ 横向距离为周长一半 = 6米；纵向高度 = 5米。最短距离 = √(6² + 5²) = √61 米。',
    detailedAnalysis: '将圆柱侧面展开为矩形平面：\n1. 苍蝇在“正对面”，展开后在横坐标的中点处，故水平距离 = 12 / 2 = 6 米。\n2. 竖直距离 = 圆柱高 = 5 米。\n3. 根据两点之间线段最短，最短路线为直角三角形斜边：L = √(6² + 5²) = √(36 + 25) = √61 米。',
    mathFormula: 'L = \\sqrt{(\\frac{C}{2})^2 + H^2} = \\sqrt{6^2 + 5^2} = \\sqrt{61}\\text{ 米}',
    simulatorConfig: {
      tab: 'unfold',
      mode: 'cylinder',
      params: { circumference: 12, height: 5, turns: 0.5 }
    }
  },
  {
    id: 'q2',
    source: '国考数量关系经典题型改编',
    title: '正方体表面两点间的最短距离',
    category: 'unfold',
    subType: '正方体展开',
    questionText: '已知一个棱长为 2 厘米的正方体木块，一只蚂蚁从底面一个顶点 A 出发，沿着正方体表面爬行到与其相对的最远顶点 B，问蚂蚁爬行的最短路程是多少厘米？',
    options: [
      { key: 'A', text: '2√3 厘米' },
      { key: 'B', text: '2√5 厘米' },
      { key: 'C', text: '6 厘米' },
      { key: 'D', text: '4√2 厘米' }
    ],
    correctAnswer: 'B',
    difficulty: '易',
    commonTraps: 'A 选项 2√3 是体对角线（蚂蚁必须在表面爬，不能穿过内部空间飞过去！）；C 选项 6 是沿 3 条棱走。',
    fastTrick: '【两面展开法】相对顶点表面爬行必跨越两个相邻正方形。横向走两个棱长（4），纵向走一个棱长（2），斜边即为最短：√(4² + 2²) = √20 = 2√5。',
    detailedAnalysis: '将正方体相邻两个面在同一直线上展开成 2×1 的长方形：\n1. 起点 A 在一角，终点 B 在长方形对角顶点。\n2. 长方形长 = 2 + 2 = 4 厘米，宽 = 2 厘米。\n3. 最短路程 L = √(4² + 2²) = √20 = 2√5 厘米。',
    mathFormula: 'L = \\sqrt{(2a)^2 + a^2} = \\sqrt{5}a = 2\\sqrt{5}\\text{ cm}',
    simulatorConfig: {
      tab: 'unfold',
      mode: 'cube',
      params: { edge: 2 }
    }
  },
  {
    id: 'q3',
    source: '省考数量关系经典题型改编',
    title: '圆锥表面绕行一周的最短距离',
    category: 'unfold',
    subType: '圆锥展开',
    questionText: '一个圆锥的底面半径为 2，母线长为 6。一只蚂蚁从圆锥底面圆周上某点 A 出发，沿着圆锥侧面爬行一周后又回到 A 点，蚂蚁爬行的最短路程是多少？',
    options: [
      { key: 'A', text: '6' },
      { key: 'B', text: '6√3' },
      { key: 'C', text: '12' },
      { key: 'D', text: '4π' }
    ],
    correctAnswer: 'B',
    difficulty: '中',
    commonTraps: '误将最短路径当作底面圆周长 2πr = 4π 选 D。爬行是在侧面上，侧面展开是扇形！',
    fastTrick: '【圆心角决定图形】圆心角 α = 360° × (r / R) = 360° × (2 / 6) = 120°。展开后是顶角为 120°、两腰为 6 的等腰三角形，底边为 2 × 6 × sin(60°) = 6√3！',
    detailedAnalysis: '1. 圆锥侧面展开图为扇形，扇形半径为母线长 R = 6。\n2. 底面周长为 2πr = 4π，对应的扇形圆心角 α = (4π / 2πR) × 360° = (2 / 6) × 360° = 120°。\n3. 蚂蚁从点 A 出发绕侧面一周回到 A，展开后即连接扇形两半径端点 A 与 A\' 的弦长。\n4. 在等腰三角形 OAA\' 中，OA = OA\' = 6，顶角 ∠AOA\' = 120°，由余弦定理或做高线：AA\' = 2 × 6 × sin(60°) = 6√3。',
    mathFormula: '\\alpha = 360^\\circ \\times \\frac{r}{R} = 120^\\circ \\implies L = 2R\\sin(\\frac{\\alpha}{2}) = 2\\times 6\\times \\frac{\\sqrt{3}}{2} = 6\\sqrt{3}',
    simulatorConfig: {
      tab: 'unfold',
      mode: 'cone',
      params: { radius: 2, slantHeight: 6 }
    }
  },
  {
    id: 'q4',
    source: '国考数量关系经典题型改编',
    title: '直角梯形绕不同轴旋转体体积',
    category: 'revolution',
    subType: '旋转体与组合体',
    questionText: '直角梯形 ABCD 中，AD ∥ BC，∠A = 90°，AD = 2，BC = 5，AB = 4。若将其绕直角边 AB 旋转一周形成几何体 V1；若将其绕底边 BC 旋转一周形成几何体 V2。问 V1 与 V2 的体积比为多少？',
    options: [
      { key: 'A', text: '13 : 12' },
      { key: 'B', text: '13 : 24' },
      { key: 'C', text: '39 : 80' },
      { key: 'D', text: '52 : 96' }
    ],
    correctAnswer: 'A',
    difficulty: '难',
    commonTraps: '绕直角高旋转是圆台；绕底边旋转是“圆柱 + 圆锥”，极容易漏算或者把圆锥高算错（圆锥高是 5 - 2 = 3，而不是 5！）。',
    fastTrick: '【拆解旋转体模型】：\nV1 绕 AB 旋转成圆台：上底半径 2，下底半径 5，高 4。V1 = (1/3)π×4×(2² + 2×5 + 5²) = 52π。\nV2 绕 BC 旋转成组合体：圆柱（底半径 4，高 2）+ 圆锥（底半径 4，高 3）。V2 = π×4²×2 + (1/3)π×4²×3 = 32π + 16π = 48π。\n两体积之比 V1 : V2 = 52π : 48π = 13 : 12。',
    detailedAnalysis: '1. 绕直角边 AB 旋转，形成的是以 AD=2 为上底半径、BC=5 为下底半径、高为 AB=4 的圆台：\n   V1 = (1/3) × π × 4 × (2² + 2×5 + 5²) = (4/3) × π × (4 + 10 + 25) = (4/3) × 39π = 52π。\n2. 绕底边 BC 旋转，将梯形分割为一个矩形和一个直角三角形：\n   • 矩形部分（长 AD=2，宽 AB=4）旋转得到底面半径为 4、高为 2 的圆柱：体积 = π × 4² × 2 = 32π。\n   • 直角三角形部分（底 5-2=3，高 4）旋转得到底面半径为 4、高为 3 的圆锥：体积 = (1/3) × π × 4² × 3 = 16π。\n   • 组合体体积 V2 = 32π + 16π = 48π。\n3. 比值 V1 : V2 = 52π : 48π = 13 : 12。',
    mathFormula: 'V_1 = \\frac{1}{3}\\pi h (r_1^2 + r_1 r_2 + r_2^2) = 52\\pi, \\quad V_2 = \\pi R^2 h_1 + \\frac{1}{3}\\pi R^2 h_2 = 48\\pi \\implies \\frac{V_1}{V_2} = \\frac{13}{12}',
    simulatorConfig: {
      tab: 'revolution',
      mode: 'trapezoid',
      params: { topR: 2, bottomR: 5, height: 4 }
    }
  },
  {
    id: 'q5',
    source: '省考图形推理截面经典题型改编',
    title: '正方体空间截面不可能的形状',
    category: 'cross_section',
    subType: '截面问题',
    questionText: '用一个平面去截一个正方体，截面形状绝对不可能出现的是下列哪一项？',
    options: [
      { key: 'A', text: '钝角三角形' },
      { key: 'B', text: '正六边形' },
      { key: 'C', text: '等腰梯形' },
      { key: 'D', text: '五边形' }
    ],
    correctAnswer: 'A',
    difficulty: '易',
    commonTraps: '很多考生以为三角形都可以切出来，却不知道正方体切出的三角形“只能是锐角三角形”，绝不可能切出钝角或直角三角形！',
    fastTrick: '【正方体截面神定律】：\n① 边数：3~6 边形（最多 6 边形，不可能 7 边形，因为只有 6 个面）；\n② 三角形只能是锐角三角形（三边均满足 a²+b² > c²），绝无直角或钝角；\n③ 四边形可以是矩形、菱形、正方形、等腰梯形，但绝不可能是普通梯形或平行四边形（非矩形/菱形）。',
    detailedAnalysis: '证明为什么不能是直角或钝角三角形：\n设截面的三个顶点分别在经过同一顶点的三条棱上，设距离分别为 x, y, z。\n则截面三角形的三条边长平方分别为：\na² = x² + y², b² = y² + z², c² = z² + x²。\n显然任意两边平方之和：\na² + b² = x² + 2y² + z² > z² + x² = c²。\n由余弦定理 cos C = (a² + b² - c²) / (2ab) > 0，故三个内角均为锐角！不可能为直角或钝角三角形。',
    mathFormula: 'a^2 + b^2 = x^2 + 2y^2 + z^2 > x^2 + z^2 = c^2 \\implies \\cos C > 0',
    simulatorConfig: {
      tab: 'cross_section',
      mode: 'cube',
      params: { preset: 'triangle' }
    }
  },
  {
    id: 'q6',
    source: '联考数量关系经典题型改编',
    title: '圆柱内外壁双层爬行问题',
    category: 'unfold',
    subType: '圆柱内壁到外壁展开',
    questionText: '一个无盖圆柱形玻璃水杯，底面周长为 16 厘米，高为 6 厘米。一只小虫在杯内壁距离杯底 2 厘米的点 A 处，想去吃杯外壁距离杯口 2 厘米且在点 A 正对面的点 B 处的蜂蜜。小虫翻过杯口爬行的最短路程是多少厘米？',
    options: [
      { key: 'A', text: '10 厘米' },
      { key: 'B', text: '10√2 厘米' },
      { key: 'C', text: '12 厘米' },
      { key: 'D', text: '8√2 厘米' }
    ],
    correctAnswer: 'A',
    difficulty: '难',
    commonTraps: '小虫是从“内壁”爬到“外壁”，中间必须越过杯口！很多考生不知道如何展开内壁和外壁。',
    fastTrick: '【内壁翻折对称到外壁】：小虫翻越杯口，可将内壁沿杯口向上“翻折”。A 点离杯顶为 6 - 2 = 4 厘米；B 点在外壁离杯顶为 2 厘米。两点纵向展开总距离 = 4 + 2 = 6 厘米。水平方向（正对面）= 16 ÷ 2 = 8 厘米。勾股弦长 = √(8² + 6²) = 10 厘米。',
    detailedAnalysis: '关键在“内外壁翻折对称法”：\n1. 小虫必须翻越杯口边缘，将杯内壁以杯口为轴向上翻折，使内壁与外壁在同一平面内展开。\n2. 在展开平面中：\n   • 水平方向：因为 B 在 A 正对面，水平横向跨度 = 半个底面周长 = 16 ÷ 2 = 8 厘米。\n   • 竖直方向：A 点在内壁，距离杯顶 6 - 2 = 4 厘米；B 点在外壁，距离杯顶 2 厘米。两点展开后的垂直落差 = 4 + 2 = 6 厘米。\n3. 最短路程即为直角三角形斜边：L = √(8² + 6²) = 10 厘米。',
    mathFormula: 'L = \\sqrt{(\\frac{C}{2})^2 + (h_{\\text{内}} + h_{\\text{外}})^2} = \\sqrt{8^2 + 6^2} = 10\\text{ cm}',
    simulatorConfig: {
      tab: 'unfold',
      mode: 'cylinder',
      params: { circumference: 16, height: 6, turns: 0.5 }
    }
  },
  {
    id: 'q7',
    source: '国考图形推理空间重构经典题',
    title: '六面体折纸盒 · 相对面与公共边排除法',
    category: 'origami',
    subType: '六面体空间重构',
    diagramType: 'origami-q7',
    questionText: '左图为给定的多面体纸盒的外表面展开图，问下列哪一项能由它折叠而成？（展开图中 6 个面包含：黑色五角星、双圆环、对角叉号、箭头、阴影正方形、斜线条面）',
    options: [
      { key: 'A', text: '同时出现【黑色五角星】与【阴影正方形】的面' },
      { key: 'B', text: '【箭头】指向【双圆环】的面' },
      { key: 'C', text: '【对角叉号】、【黑色五角星】与【箭头】相邻，时针方向一致' },
      { key: 'D', text: '【双圆环】与【斜线条面】为相邻面且线条平行于公共边' }
    ],
    correctAnswer: 'C',
    difficulty: '中',
    commonTraps: '极容易忽视“相对面不能同时出现”。在展开图中，黑色五角星与阴影正方形隔一个面，必为相对面，因此在立体图中绝对不可能同时看到！A 选项直接排除。',
    fastTrick: '【核心判定两步法】：\n1. 相对面排误：同生共死皆为错！五角星与阴影正方形是相对面，A 选项同时出现必错！\n2. 公共顶点时针法：顺时针观察公共顶点，展开图与立体图时针顺序一致的即为正解（C）。',
    detailedAnalysis: '1. 相对面判定：\n   • 黑色五角星 与 阴影正方形在同一行相隔一个面，为【相对面】，立体图中不能同时看到，排除 A；\n   • 双圆环 与 箭头在展开图中相邻，但箭头的指向是背离圆环而非指向圆环，排除 B；\n2. 相邻面时针判定：\n   • 取对角叉号、五角星与箭头的公共交点，顺时针方向依次为叉号 ➔ 五角星 ➔ 箭头，立体图与展开图完全吻合，故 C 正确。',
    mathFormula: '\\text{相对面判定：同行/同列隔一格 } \\implies \\text{互为相对面（不可能同时出现）}',
    simulatorConfig: {
      tab: 'origami',
      mode: '1-4-1',
      params: { highlight: 'opposite' }
    }
  },
  {
    id: 'q8',
    source: '国考行测立体拼合经典题',
    title: '立体拼合 · 3×3×3 大正方体空间凹凸互补',
    category: 'assembly',
    subType: '立体拼合与旋转',
    diagramType: 'assembly-q8',
    questionText: '下列立体图形均由大小相同的小正方体组成。已知图①有 11 个小正方体，图②有 9 个小正方体。问下列哪个选项的积木与图①、图②拼合后，可以组合成一个 3×3×3 的完整大正方体？',
    options: [
      { key: 'A', text: '含有 8 个小立方体的一字型积木' },
      { key: 'B', text: '含有 7 个小立方体、带凸起直角的异形积木' },
      { key: 'C', text: '含有 6 个小立方体的三层凹字型积木' },
      { key: 'D', text: '含有 7 个小立方体但具有单点空悬结构的积木' }
    ],
    correctAnswer: 'B',
    difficulty: '中',
    commonTraps: '很多考生直接在脑中无序旋转，导致空间错乱。其实第一步先做“小正方体守恒”算术题，总数 27 - 11 - 9 = 7，直接排除 A(8块) 和 C(6块)！',
    fastTrick: '【先数方块总数，再看凹凸互补】：\n1. 算术守恒：3×3×3 总共需 27 块。缺失方块数 = 27 - 11 - 9 = 7 块！直接排除 A (8块) 和 C (6块)。\n2. 观察空缺凹槽：图①和图②组合后的空缺呈 2×2×2 角落带有 1 个凸起，只有 B 选项经空间旋转后能完全咬合，无缝拼接！',
    detailedAnalysis: '1. 方块数量守恒排除法：\n   完整大正方体体积 = 3 × 3 × 3 = 27 块。\n   已有部分：图①(11块) + 图②(9块) = 20 块。\n   拼合组件必须恰好有 27 - 20 = 7 块小立方体。由此立即排除 A（8块）和 C（6块）。\n2. 空间凹凸位置匹配：\n   对剩余空缺进行空间层分析：底层缺 3 块，中层缺 3 块，顶层缺 1 块。\n   将 B 选项在空间旋转后，其凸起处与空缺凹槽精准契合，严丝合缝组合成 3×3×3 大正方体。',
    mathFormula: 'N_{\\text{目标}} = 3^3 = 27, \\quad N_{\\text{缺失}} = 27 - (11 + 9) = 7',
    simulatorConfig: {
      tab: 'assembly',
      mode: 'cube3x3',
      params: { showSlot: true }
    }
  },
  {
    id: 'q9',
    source: '国考图形推理展开图经典题',
    title: '正方体展开图构型判定 · 11 种合法形态与排误法则',
    category: 'origami',
    subType: '展开图合法性判定',
    questionText: '下列四个由 6 个完全相同正方形组成的平面图形中，绝对无法折叠成封闭正方体的是哪一项？',
    options: [
      { key: 'A', text: '局部含有 2×2 四个正方形紧贴组成的“田”字形连方' },
      { key: 'B', text: '中间 4 个一字排开，上下各 1 个正方形的“1-4-1”型' },
      { key: 'C', text: '中间 3 个一排，上方 2 个、下方 1 个像楼梯拐角的“2-3-1”型' },
      { key: 'D', text: '两排各 3 个正方形，错开 2 格仅一端相连的“3-3”型' },
    ],
    correctAnswer: 'A',
    difficulty: '易',
    commonTraps: '不少考生在脑中盲目折叠半天，其实正方体展开图在几何拓扑上只有 11 种合法形态。只要出现“田字形”或“凹字形”，折叠后必定发生两面重叠，可快速排误！',
    fastTrick: '【正方体展开图速览口诀】：\n① 合法形态只有 11 种：“一四一有六、二三一有三、二二二阶梯、三三错开仅一连”；\n② 非法三大致命陷阱：“田字必重合、凹字必重合、一线不过四”。出现 2×2 田字格无论怎么折都会重合，直接选 A！',
    detailedAnalysis: '1. 正方体表面展开图数学规律：\n   • 正方体有 6 个面、12 条棱，沿 7 条棱剪开铺平，在几何上恰好只有 11 种本质不同的平面多米诺展开图（六连方）。\n   • 分类为：1-4-1 型（6种）、2-3-1 型（3种）、2-2-2 阶梯型（1种）、3-3 错位型（1种）。B、C、D 分别属于合法的 1-4-1、2-3-1、3-3 型，均可折成正方体。\n2. 非法构型特征：\n   • “田”字形：2×2 四个面在同一点共顶，折起时由于四面均为 90° 直角，其中两面折转 90° 后会在空间发生 100% 空间重叠，同时另一侧缺少面，无法形成闭合正方体。\n   • 故 A 选项绝对无法折成正方体。',
    mathFormula: 'N_{\\text{合法展开图总数}} = 6_{(141)} + 3_{(231)} + 1_{(222)} + 1_{(33)} = 11',
    simulatorConfig: {
      tab: 'origami',
      mode: '2-3-1',
      params: { highlight: 'opposite' }
    }
  }
];
