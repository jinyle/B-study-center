import { useState } from "react";
import { 
  Calculator, 
  Sparkles, 
  RefreshCw, 
  Compass, 
  Search, 
  BookOpen, 
  CheckCircle2, 
  HelpCircle, 
  Activity, 
  ArrowRight, 
  Lightbulb,
  CornerDownRight
} from "lucide-react";

interface VariableConfig {
  symbol: string;
  name: string;
  unit: string;
  placeholder: string;
  defaultValue: number;
}

interface KnowledgeCard {
  id: string;
  subject: "chinese" | "math" | "english" | "physics" | "chemistry" | "biology";
  subjectLabel: string;
  category: string; // "现代文阅读", "文言文", "平面几何", "时态句法" etc.
  name: string;
  expression: string; // Core slogan or formula
  desc: string;
  tips: string[];
  // For interactive calculator items
  variables?: VariableConfig[];
  calculate?: (inputs: { [key: string]: number }) => { steps: string[]; value: number; unit: string };
  // For interactive humanities items
  interactiveQuiz?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

const KNOWLEDGE_DATABASE: KnowledgeCard[] = [
  // --- CHINESE ---
  {
    id: "zh_rhetoric",
    subject: "chinese",
    subjectLabel: "语文 📚",
    category: "现代文阅读大块",
    name: "中考修辞手法万能解题模板",
    expression: "修辞名称 + 具体内容 + 渲染效果 + 核心情感",
    desc: "现代文阅读的必考大分项。答题时决不能只写‘生动形象’，而需要精确分析句中的字词对画面和作者情感的烘托作用。",
    tips: [
      "比喻/拟人：生动形象地写出了【对象】的【特征】，表达了作者的...感情。",
      "排比：增添了文章句型气势，层层递进地突出了【对象】的...，抒发了强烈的...豪情。",
      "设问：自问自答，起承转合，激发读者的阅读兴趣，引起对【问题】的思考。"
    ],
    interactiveQuiz: {
      question: "《出师表》中‘臣本布衣，躬耕于南阳’使用了什么句法或特殊表达意蕴？",
      options: [
        "比喻手法以‘布衣’谦称，衬托刘备三顾茅庐的知遇之恩",
        "夸张手法，写诸葛亮不干农活只做衣服的奢华生活",
        "借代手法以‘布衣’代普通百姓，点明起家寒微与不求闻达的本心"
      ],
      correctIndex: 2,
      explanation: "正确！‘布衣’代指平民，属于借代手法。诸葛亮以此表明自己起于寒微，毫无出仕称雄的虚荣，反衬出蜀汉兴亡的忠义担当。"
    }
  },
  {
    id: "zh_classical",
    subject: "chinese",
    subjectLabel: "语文 📚",
    category: "文言文名篇大块",
    name: "古汉语名词活用作动词快速判定",
    expression: "名词处在谓语位置 / 紧接宾语代词 => 活用作动词",
    desc: "阅读文言文翻译题时的重点与坎。一个名词如果前面受到副词、能愿动词修饰，或后面直接跟了代词/宾语名词，它已经转生为动词！",
    tips: [
      "‘一狼洞其中’的【洞】：后面跟宾语其中，活用为‘挖洞’。",
      "‘驴不胜怒，蹄之’的【蹄】：前面有主语，后面有代词‘之’（指老虎），活用为‘用蹄子踢’。",
      "‘妇抚儿乳’的【乳】：动作发生在妇人抚摸婴儿之后，活用为‘喂奶’。"
    ]
  },
  {
    id: "zh_writing",
    subject: "chinese",
    subjectLabel: "语文 📚",
    category: "考场作文大块",
    name: "高分作文‘凤头’递进排偶法",
    expression: "自然景物切入 + 哲理排比金句 + 亮明文章论点",
    desc: "开头前三行是考场作文的‘颜值核心’。通过视觉、联想的递进，用富有对称美的小排偶句瞬间锁死阅卷老师的高分预期。",
    tips: [
      "模板一：若生命是一场旅行，挫折便是沿途的风雨；若灵魂是一方墨砚，磨练便是无声的香墨。恰是执着，润色了这一季芬芳。",
      "模板二：浩瀚星汉，每一颗星辰都在奋力燃烧自己的光华；浩大平原，每一株野草都在努力摇曳春天的梦想。作为少年的我们..."
    ]
  },

  // --- MATH ---
  {
    id: "math_pythagoras",
    subject: "math",
    subjectLabel: "数学 📐",
    category: "解析几何大块",
    name: "中考勾股定理各边快速求值器",
    expression: "a² + b² = c² (c为直角斜边)",
    desc: "几何压轴动点与证明题中的地基定理。只要输入任意两条直角边 a 和 b，即可为你极速求出斜边 c 并输出严谨的算术步骤。",
    tips: [
      "常与‘面积等积法’结合：在同一个直角三角形中，底边a×高度b ＝ 斜边c×斜边高h，求斜边高极好用。",
      "备考警示：套公式前务必确认存在‘直角’或‘垂直’条件，避免非直角强行计算！"
    ],
    variables: [
      { symbol: "a", name: "直角边 a 长度", unit: "cm", placeholder: "例如: 3", defaultValue: 3 },
      { symbol: "b", name: "直角边 b 长度", unit: "cm", placeholder: "例如: 4", defaultValue: 4 },
    ],
    calculate: (inputs) => {
      const a = inputs["a"] || 0;
      const b = inputs["b"] || 0;
      const val = Math.sqrt(a * a + b * b);
      return {
        steps: [
          `1. 识别直角三角形的勾股定理公式：斜边 c = √(a² + b²)`,
          `2. 代入自变量参数值：c = √(${a}² + ${b}²) = √(${a * a} + ${b * b})`,
          `3. 求两直角边平方和：c² = ${a * a + b * b}`,
          `4. 开算术二次方根：c ≈ ${val.toFixed(2)} cm`
        ],
        value: parseFloat(val.toFixed(2)),
        unit: "cm"
      };
    }
  },
  {
    id: "math_quadratic",
    subject: "math",
    subjectLabel: "数学 📐",
    category: "代数方程大块",
    name: "一元二次方程根判别与极速求解",
    expression: "ax² + bx + c = 0 (a ≠ 0) | Δ = b² - 4ac",
    desc: "自动通过判别式判断实数根的有无。输入系数 a, b, c，黑板将为你瞬间完成中考高频代数配平运算并计算实数解。",
    tips: [
      "若 Δ > 0，方程有两个不相等的实数根：x1, x2 = (-b ± √Δ) / 2a",
      "若 Δ = 0，方程有两个相等的实数根：x1 = x2 = -b / 2a",
      "若 Δ < 0，方程在实数范围内无解，复数域中存在一对共轭复数解。"
    ],
    variables: [
      { symbol: "a", name: "二次项系数 a", unit: "", placeholder: "1", defaultValue: 1 },
      { symbol: "b", name: "一次项系数 b", unit: "", placeholder: "例如: -5", defaultValue: -5 },
      { symbol: "c", name: "常数项系数 c", unit: "", placeholder: "例如: 6", defaultValue: 6 },
    ],
    calculate: (inputs) => {
      const a = inputs["a"] || 1;
      const b = inputs["b"] || 0;
      const c = inputs["c"] || 0;
      
      if (a === 0) {
        return {
          steps: ["注意：一元二次方程中二次项系数 a 绝对不能等于 0！目前退化为一元一次方程！", `计算式：${b}x + ${c} = 0`, `解为：x = ${(-c/b).toFixed(2)}`],
          value: parseFloat((-c/b).toFixed(2)),
          unit: "(一元一次简易解)"
        };
      }

      const delta = b * b - 4 * a * c;
      const steps = [
        `1. 提取各项系数：a = ${a}, b = ${b}, c = ${c}`,
        `2. 计算中考判别式：Δ = b² - 4ac = (${b})² - 4 × (${a}) × (${c})`,
        `3. 判别计算得：Δ = ${b * b} - ${4 * a * c} = ${delta}`
      ];

      if (delta < 0) {
        steps.push(`4. 结论：由于判别式 Δ (${delta}) < 0，所以在任一实数范围内【方程无实数解】！`);
        return { steps, value: 0, unit: "无实根" };
      } else if (delta === 0) {
        const root = -b / (2 * a);
        steps.push(`4. 结论：由于 Δ = 0，方程有唯一重根。`);
        steps.push(`5. 代入求根：x = -(${b}) / (2 × ${a}) = ${root.toFixed(2)}`);
        return { steps, value: parseFloat(root.toFixed(2)), unit: "唯一实数解" };
      } else {
        const r1 = (-b + Math.sqrt(delta)) / (2 * a);
        const r2 = (-b - Math.sqrt(delta)) / (2 * a);
        steps.push(`4. 结论：由于 Δ (${delta}) > 0，方程有两个不同实根。`);
        steps.push(`5. 计算对应根：x1 = (${-b} + √${delta}) / ${2 * a} ≈ ${r1.toFixed(2)}`);
        steps.push(`6. 计算对应根：x2 = (${-b} - √${delta}) / ${2 * a} ≈ ${r2.toFixed(2)}`);
        return { steps, value: parseFloat(r1.toFixed(2)), unit: `和根x2=${r2.toFixed(2)}` };
      }
    }
  },
  {
    id: "math_inverse",
    subject: "math",
    subjectLabel: "数学 📐",
    category: "几何函数压轴",
    name: "反比例函数动点比例矩形定理",
    expression: "S矩形 = |k| (动点到两坐标轴垂线围成矩形面积)",
    desc: "双曲线 y = k / x 极其重要的纯面积恒定几何重心。无论动点P在双曲线上如何摆动，向两轴拉垂线得到的矩形面积绝对等于 |k|。",
    tips: [
      "常考变体：点P向一个轴拉垂线与原点围成三角形的面积 S_tri = 1/2 * |k|。",
      "警示：做题代入k求面积时，别忘了加上绝对值！面积不能是负数哦。"
    ],
    interactiveQuiz: {
      question: "已知反比例函数 y = -6 / x 上有一动点M。M向x轴、y轴作垂线，与坐标轴所围成的直角三角形面积是多少？",
      options: [
        "面积等于 6，因为 k = -6，绝对值是 6",
        "面积等于 3，因为围成的三角形面积等于 1/2 * |k| = 3",
        "面积等于 -3，根据比例反算得出"
      ],
      correctIndex: 1,
      explanation: "太棒了！直角三角形面积恒等于 1/2 * |k|。这里的 k = -6，所以绝对值为 6，最终三角形面积为 1/2 * 6 = 3。"
    }
  },

  // --- ENGLISH ---
  {
    id: "en_perfect",
    subject: "english",
    subjectLabel: "英语 🔠",
    category: "时态与语法大块",
    name: "现在完成时态 瞬时动词/延续状态诊断器",
    expression: "have/has + 过去分词 (瞬间动词不可连缀for/since时间段)",
    desc: "中考单选和词形填空的终极大坑。当有 for + 时间段 (例如 for 2 years) 时，动词必须是延续状态！",
    tips: [
      "❌ join the league => ✔️ be inside / be a member of the league",
      "❌ buy the book => ✔️ keep the book",
      "❌ die for years => ✔️ be dead for years"
    ],
    interactiveQuiz: {
      question: "选出语法最正确的一句：They have _____ this new school computer since 2024.",
      options: [
        "bought (瞬间买入)",
        "kept (延续持有状态)",
        "buyed (错误拼写)"
      ],
      correctIndex: 1,
      explanation: "正确！since 2024 是延续性时间段，不能和买、卖、加入等瞬间动词的完成式连用。应该配合延续状态的 owned 或 kept。"
    }
  },
  {
    id: "en_object",
    subject: "english",
    subjectLabel: "英语 🔠",
    category: "从句语法大块",
    name: "中考宾语从句‘语序与时态’黄金对称",
    expression: "极硬指标：主句过去式 => 从句必须过去 | 时态陈述句语序",
    desc: "解构宾语从句的两大核心法宝：1. 从句必须回归陈述语序（主语 + 谓语）；2. 时态必须受制于主句的引申，除非从句是客观常识真理！",
    tips: [
      "语序排雷：Do you know who he is? (不能写 who is he)",
      "时态排雷：He told me that he would come tomorrow. (主句是一般过去 told，从句 will 变 would)",
      "真常理独立：The teacher said that water boils at 100 degrees. (客观现象永远用一般现在时！)"
    ]
  },
  {
    id: "en_writing",
    subject: "english",
    subjectLabel: "英语 🔠",
    category: "写作升级大块",
    name: "作文名师满分核心替换替换句型",
    expression: "平民词汇 vs 学霸句法 (It is of great significance to do...)",
    desc: "如何拯救普通平淡的英语小作文？用带有对称、倒装等进阶语法的句型直接亮瞎改卷评委：",
    tips: [
      "把 'I think' 替换为 => 'From my perspective / As far as I am concerned...'",
      "把 'It is very important for us to protect environment' 替换为 => 'It is of vital importance for us to preserve our environment.'",
      "把 'We can achieve success if we work hard' 替换为倒装 => 'Only by working hard can we achieve our ultimate success.'"
    ]
  },

  // --- PHYSICS ---
  {
    id: "phys_velocity",
    subject: "physics",
    subjectLabel: "物理 ⚛️",
    category: "力学与声光大块",
    name: "路程与运动速度 (v = s / t) 测算沙盒",
    expression: "v = s / t (米每秒 / 千米每小时)",
    desc: "最基本的力学公式。本实验箱能基于输入的距离(s)与耗时(t)推演精确的参考速度，并同时指出换算比例。",
    tips: [
      "注意单位换算：1 m/s = 3.6 km/h（高速公路超速问题常考此点）。",
      "物理意义：表示物体位置改变快慢的物理量。"
    ],
    variables: [
      { symbol: "s", name: "运动距离 s", unit: "米 (m)", placeholder: "例如: 100", defaultValue: 100 },
      { symbol: "t", name: "所需时间 t", unit: "秒 (s)", placeholder: "例如: 10", defaultValue: 10 },
    ],
    calculate: (inputs) => {
      const s = inputs["s"] || 0;
      const t = inputs["t"] || 1;
      const val = s / t;
      return {
        steps: [
          `1. 使用物理速度计算基本公式：v = s ÷ t`,
          `2. 导入现场实验数据数值：v = ${s} m ÷ ${t} s`,
          `3. 精算对应结果：v = ${val.toFixed(2)} m/s`,
          `4. 单位同等换算：折算为时速为 ${(val * 3.6).toFixed(1)} km/h（千米每小时）`
        ],
        value: parseFloat(val.toFixed(2)),
        unit: "m/s"
      };
    }
  },
  {
    id: "phys_pressure",
    subject: "physics",
    subjectLabel: "物理 ⚛️",
    category: "压强浮力大块",
    name: "固体压强力学与精密接触面积判定",
    expression: "p = F / S (1 Pa = 1 N/m²)",
    desc: "中考经典压强算术。这里的‘受力面积 S’是指【两个挤压物体真正发生的公共覆盖接触面积】，千万别把总面积带进去！",
    tips: [
      "物理错因：误以为受力面积就是下层物体的总表面积。实际上仅统计重叠受力部分。",
      "换算小技巧：一平方厘米(cm²) ＝ 10⁻⁴ 平方米(m²)，注意换算！"
    ],
    variables: [
      { symbol: "F", name: "垂直作用力 F", unit: "牛顿 (N)", placeholder: "例如: 200", defaultValue: 200 },
      { symbol: "S", name: "公共接触受力面积 S", unit: "㎡", placeholder: "例如: 0.5", defaultValue: 0.5 },
    ],
    calculate: (inputs) => {
      const F = inputs["F"] || 0;
      const S = inputs["S"] || 1;
      const val = F / S;
      return {
        steps: [
          `1. 锁定压强求导计算公式：p = F / S`,
          `2. 代入物理实验数值：p = ${F} N ÷ ${S} ㎡`,
          `3. 计算固体所产生的均匀表面压强：p = ${val.toFixed(1)} Pa (帕斯卡)`
        ],
        value: parseFloat(val.toFixed(1)),
        unit: "Pa"
      };
    }
  },
  {
    id: "phys_ohm",
    subject: "physics",
    subjectLabel: "物理 ⚛️",
    category: "电学与中考断路大块",
    name: "欧姆定律 (I = U / R) 与并联串联电阻断路",
    expression: "I = U / R (电流 = 电压 / 电阻)",
    desc: "电学中绝对统治神作。黑板除了为你计算伏安量，还会教你如何从串并联的故障灯泡中排查断路所在。",
    tips: [
      "串联分压口诀：电阻越大，分得的端电压越高 (U1/U2 = R1/R2)。",
      "故障口诀：电压表示数接近电源电压，而电流表示数为零，说明电压表并联的电阻发生了【开路/断路】故障！"
    ],
    variables: [
      { symbol: "U", name: "导体两端电压 U", unit: "伏特 (V)", placeholder: "例如: 220", defaultValue: 220 },
      { symbol: "R", name: "导体固有电阻 R", unit: "欧姆 (Ω)", placeholder: "例如: 44", defaultValue: 44 },
    ],
    calculate: (inputs) => {
      const U = inputs["U"] || 0;
      const R = inputs["R"] || 1;
      const val = U / R;
      return {
        steps: [
          `1. 根据最著名的欧姆电学公式：I = U ÷ R`,
          `2. 模拟计算流段：I = ${U} V ÷ ${R} Ω`,
          `3. 最终流过电阻的瞬时物理电流：I = ${val.toFixed(2)} A (安培)`
        ],
        value: parseFloat(val.toFixed(2)),
        unit: "A"
      };
    }
  },

  // --- CHEMISTRY ---
  {
    id: "chem_solutions",
    subject: "chemistry",
    subjectLabel: "化学 🧪",
    category: "酸碱盐实验大块",
    name: "化学溶质/溶液含量质量分数配制器",
    expression: "w = m(溶质) / [m(溶质) + m(溶剂)] × 100%",
    desc: "化学实验室制备的基础计算。如果溶解的粉末超出了该温度下的‘极限溶解度’，未溶的沉淀绝不能计入公式的分子、分母中！",
    tips: [
      "中考重点：温差变动改变溶解上限。多出的晶体结晶不算入溶液里面。",
      "操作避坑：配制含水溶液，一般是‘盐/糖缓缓倒入水中’而不是先注盐再淋水防飞溅。"
    ],
    variables: [
      { symbol: "m1", name: "溶质质量 (干燥粉末等)", unit: "克 (g)", placeholder: "例如: 20", defaultValue: 20 },
      { symbol: "m2", name: "溶剂质量 (常温纯水等)", unit: "克 (g)", placeholder: "例如: 80", defaultValue: 80 },
    ],
    calculate: (inputs) => {
      const m1 = inputs["m1"] || 0;
      const m2 = inputs["m2"] || 1;
      const total = m1 + m2;
      const val = (m1 / total) * 100;
      return {
        steps: [
          `1. 确定水跟溶质重合的总溶液重量：m(溶液) = 溶质(${m1}g) + 水溶剂(${m2}g) = ${total}g`,
          `2. 溶质品质质量分数计算式：w = m(溶质) ÷ m(溶液) × 100%`,
          `3. 带入物理量数据计算：w = ${m1}g / ${total}g × 100%`,
          `4. 获取质量百分比：w ≈ ${val.toFixed(2)} %`
        ],
        value: parseFloat(val.toFixed(2)),
        unit: "%"
      };
    }
  },
  {
    id: "chem_metathesis",
    subject: "chemistry",
    subjectLabel: "化学 🧪",
    category: "复分解反应大块",
    name: "复分解反应发生条件与沉淀筛滤",
    expression: "产生「沉淀↓ 或 气体↑ 或 水H₂O」三者中至少其一",
    desc: "非氧化还原反应中最主要的中考大题题眼。两种电解质交换成分的前提，是交换后面必须要诞生不溶解的杂质、易跑水的气体或者难以解离的液态水！",
    tips: [
      "著名产气例子：碳酸钙与稀盐酸 => 氯化钙 + 气体CO₂↑ + H₂O",
      "经典无效例子：食盐(NaCl) 遇 硝酸钾(KNO₃) => 没有任何沉淀/水/气体，不发生实际化学互动！",
      "大底线：反应物必须在可溶介质环境下才有更高概率发生碰撞反应。"
    ],
    interactiveQuiz: {
      question: "将氢氧化钠(NaOH)溶液与稀硫酸(H₂SO₄)混合，会发生化学反应吗？为什么？",
      options: [
        "不会反应，因为既没有看到白色的沉淀，也没看到冒泡泡的气体",
        "会发生复分解反应，因为它们酸碱中和，生成了强相互作用的极弱电解质「水 H₂O」",
        "不会反应，因为金属活动性中钠在氢的前方，互不干涉。"
      ],
      correctIndex: 1,
      explanation: "太赞了！酸碱中和是复分解反应的经典。由于生成了难以离解的弱电解质——水（H₂O），所以即便表面上无色无味无现象，反应却极速发生了！"
    }
  },
  {
    id: "chem_solubility",
    subject: "chemistry",
    subjectLabel: "化学 🧪",
    category: "离群鉴定大块",
    name: "中考必考酸碱盐溶解性背诵口诀",
    expression: "极速秒杀：钾钠铵硝皆可溶 | 盐酸不溶氯化银",
    desc: "初三复盘各种颜色推断和固体离子的灵魂图表。通过几行简单的民谚，通吃溶解度鉴定表中的绝大部分重难点！",
    tips: [
      "硝酸盐、铵盐、钾盐、钠盐一律可溶入日常温水中。",
      "硫酸盐中【硫酸钡 BaSO₄】不仅不溶于水，甚至连强酸（稀硝酸）也一律溶解不动！",
      "氯化物中【氯化银 AgCl】同样为不溶于酸的雪白色沉淀，看到这两个雷打不动，基本锁定它们！"
    ]
  },

  // --- BIOLOGY ---
  {
    id: "bio_photo",
    subject: "biology",
    subjectLabel: "生物 🧬",
    category: "生命能效循环大块",
    name: "植物光合与呼吸作用日夜双循环",
    expression: "日间：光合作用(积累) > 呼吸作用 | 夜晚：纯呼吸(消耗有机物)",
    desc: "叶绿体负责光合蓄能（吐氧），线粒体负责呼吸供能（吐二氧化碳）。这是一个全天候互为因果、持续工作的植物微型有机质飞轮。",
    tips: [
      "中考易错：植物24小时都在进行呼吸作用！白天只是因为光合作用极其旺盛，掩盖了呼吸消耗的迹象而已。",
      "农业学霸技巧：昼夜温差大，能让白天积累大堆白砂糖等有机量，晚上冷寂又能有效扼制呼吸损耗，水果因此变甜！"
    ]
  },
  {
    id: "bio_micro",
    subject: "biology",
    subjectLabel: "生物 🧬",
    category: "微观探客大块",
    name: "显微镜载玻片‘对向移动’方位模拟器",
    expression: "黄金定理：物偏哪方，玻片就朝哪方推！",
    desc: "在显微镜下，我们看到的是‘上下颠倒、左右相反’的完全反向倒像。所以它在镜头里朝哪里偏，就往哪边推，就可以复原到轴心。",
    tips: [
      "比如，物像在左上方，如果想让它到视野中央，应将载玻片向【左上方】移动。",
      "微观放大约束：高倍镜下视野较暗，因为折射光量变少，应该开大光圈，换用凹面镜反射补充光强。"
    ],
    variables: [
      { symbol: "px", name: "物像在显微镜下的偏斜情况 (1为左上，2为右下)", unit: "(代号)", placeholder: "偏左上填1，偏右下填2", defaultValue: 1 },
    ],
    calculate: (inputs) => {
      const px = inputs["px"] || 1;
      const isLeftTop = px === 1;
      return {
        steps: [
          `1. 识别光学倒镜原理：显微镜目镜与物镜两级高分辨折射成像，是[中心对称]的反射投影。`,
          `2. 提取输入偏位：当前属于【${isLeftTop ? "左上方" : "右下方"}】。`,
          `3. 分析推运规律 (物偏哪推哪)：为了让该晶胞朝正中反向位移：`,
          `4. 输出名师实操指导：必须将载玻片朝着【${isLeftTop ? "左上方" : "右下方"}】缓缓推动，这样在视野镜里它就会朝着中间乖乖滑回去啦！`
        ],
        value: px,
        unit: "(移片完毕)"
      };
    }
  },
  {
    id: "bio_foodchain",
    subject: "biology",
    subjectLabel: "生物 🧬",
    category: "大自然生态大块",
    name: "大自然生态系统食物链黄金绘制法则",
    expression: "起点必定为生产者 -> 终点为最高统治捕食者 (箭头指向能流方向)",
    desc: "展现生态群落物种间通过吃与被吃而链结的能量流动规律。必须高度掌握物种等级及重金属富集的因果判定：",
    tips: [
      "画食物链铁律：不能包含细菌真菌等‘分解者’，也不能画‘太阳、水滴’等非生命背景环境！",
      "箭头神向：由被吃者指向吃它的那个生物！例如：草 ─> 兔 ─> 鹰（表示植物卡路里流入了兔，最后流入了鹰）。",
      "重金属巨坑 (富集)：沿食物链越到金字塔顶点，有害物质（难以被生物排出的毒素）在体内浓度反倒无限倍翻倍高！"
    ],
    interactiveQuiz: {
      question: "在一片被铅污染的稻田里：水稻 ─> 蝗虫 ─> 青蛙 ─> 蛇。请问谁身体里的铅毒素浓度最高、受毒害最深？",
      options: [
        "水稻，因为它最先扎根于有污染的泥沙中",
        "蛇，根据生态毒素富集原理，食物链越高顶，体内积压累积的毒素浓度越惊人",
        "青蛙跟蝗虫，由于它们经常发生跳跃，加快了重金属吸附"
      ],
      correctIndex: 1,
      explanation: "完美答对！由于重金属极难被生物体排泄，所以随着‘草被虫吃、虫被蛙吃、蛙被蛇吞’，在蛇体内将堆满上游累积出来的所有的毒素晶体，这叫「生物富集作用」！"
    }
  }
];

export default function FormulaHelper() {
  const [activeTab, setActiveTab] = useState<"all" | "chinese" | "math" | "english" | "physics" | "chemistry" | "biology">("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // States of currently selected card to display details or computational simulator
  const [activeCardId, setActiveCardId] = useState<string>(KNOWLEDGE_DATABASE[3].id); // Defaults to Pythagoras calculator

  // Calculator inputs & result trackers
  const [calcInputs, setCalcInputs] = useState<{ [key: string]: string }>({});
  const [calcResult, setCalcResult] = useState<{ value: number; steps: string[]; unit: string } | null>(null);

  // Humanities quizzes dynamic trackers
  const [quizScore, setQuizScore] = useState<{ [cardId: string]: { answered: boolean; correct: boolean; chosenIdx: number } }>({});

  const handleTabChange = (tab: "all" | "chinese" | "math" | "english" | "physics" | "chemistry" | "biology") => {
    setActiveTab(tab);
  };

  const handleCardSelect = (card: KnowledgeCard) => {
    setActiveCardId(card.id);
    setCalcInputs({});
    setCalcResult(null);
  };

  // Run equations compute algorithm!
  const handleRunCompute = (card: KnowledgeCard) => {
    if (!card.calculate || !card.variables) return;
    const parsed: { [key: string]: number } = {};
    for (const v of card.variables) {
      const valStr = calcInputs[v.symbol];
      let num = parseFloat(valStr);
      if (isNaN(num)) {
        num = v.defaultValue; // Fallback to preset defaults
      }
      parsed[v.symbol] = num;
    }

    try {
      const res = card.calculate(parsed);
      setCalcResult(res);
    } catch (err) {
      console.error("Compute error", err);
    }
  };

  // Reset calculator inputs
  const handleResetCalc = () => {
    setCalcInputs({});
    setCalcResult(null);
  };

  // Handle selected answer on humanities card
  const handleAnswerQuiz = (cardId: string, correctIdx: number, userIdx: number) => {
    setQuizScore(prev => ({
      ...prev,
      [cardId]: {
        answered: true,
        correct: userIdx === correctIdx,
        chosenIdx: userIdx
      }
    }));
  };

  // Filter cards based on subject tab AND text lookup query
  const filteredCards = KNOWLEDGE_DATABASE.filter(card => {
    const matchSubject = activeTab === "all" || card.subject === activeTab;
    const cleanSearch = searchTerm.trim().toLowerCase();
    if (!cleanSearch) return matchSubject;
    
    const label = card.name + card.expression + card.desc + card.category;
    return matchSubject && label.toLowerCase().includes(cleanSearch);
  });

  const activeCard = KNOWLEDGE_DATABASE.find(c => c.id === activeCardId) || KNOWLEDGE_DATABASE[0];

  return (
    <div className="bg-slate-900/65 backdrop-blur-xl rounded-[32px] border border-white/10 shadow-3xl p-6 lg:p-10 w-full relative z-10 animate-fade-in">
      
      {/* Decorative sparkle banner background */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-500/10 to-purple-600/5 blur-3xl rounded-full pointer-events-none" />

      {/* CORE HEADER INTRO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-white/10">
        <div className="flex items-center gap-4.5">
          <div className="w-12 h-12 bg-gradient-to-tr from-[#3b82f6] to-[#6366f1] text-white rounded-2xl flex items-center justify-center shadow-xl border border-white/10 shrink-0">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2 font-sans">
              全科重点知识库与数理实验沙盒 🧭
              <Sparkles className="w-5 h-5 text-amber-400 fill-amber-400/20" />
            </h2>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              囊括语文重难模板、数理化公式计算步骤、英语高级句式及生物规律，支持全学科自由检索与交互推演学习！
            </p>
          </div>
        </div>

        {/* Real-time Search Box - perfect for fuzzy query requirement */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔎 输入任何中考知识点/公式检索..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-white/10 focus:border-indigo-505 rounded-xl text-xs font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold hover:text-white"
            >
              清空
            </button>
          )}
        </div>
      </div>

      {/* SUBJECTS TAB PILLS */}
      <div className="flex flex-wrap gap-2 mb-8 bg-white/5 p-1.5 rounded-2xl border border-white/5">
        {[
          { id: "all", label: "全部学科通识" },
          { id: "chinese", label: "语文 📚" },
          { id: "math", label: "数学 📐" },
          { id: "english", label: "英语 🔠" },
          { id: "physics", label: "物理 ⚛️" },
          { id: "chemistry", label: "化学 🧪" },
          { id: "biology", label: "生物 🧬" }
        ].map(sub => {
          const isActive = activeTab === sub.id;
          return (
            <button
              key={sub.id}
              onClick={() => handleTabChange(sub.id as any)}
              className={`px-4.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer border border-transparent ${
                isActive 
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg border-white/10"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              {sub.label}
            </button>
          );
        })}
      </div>

      {/* MAIN TWO COLUMN COCKPIT - Utilizing maximum horizontal width! */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Categorized Cards Grid and Search Results (Col: 4) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-black uppercase text-slate-450 tracking-widest block">当前分类大块知识点目录</span>
            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
              共 {filteredCards.length} 项所获
            </span>
          </div>

          <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-2 dataset-scrollbar">
            {filteredCards.length > 0 ? (
              filteredCards.map((card) => {
                const isSelected = activeCardId === card.id;
                let bgStyle = "bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10";
                let textStyle = "text-slate-100";
                
                if (isSelected) {
                  bgStyle = "bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border-indigo-500/40 shadow-xl";
                  textStyle = "text-blue-300";
                }

                return (
                  <button
                    key={card.id}
                    onClick={() => handleCardSelect(card)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer block relative overflow-visible ${bgStyle}`}
                  >
                    <div className="flex justify-between items-start gap-1">
                      <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/15 px-2 py-0.5 rounded uppercase tracking-wide shrink-0">
                        {card.category}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono font-bold shrink-0">
                        {card.subjectLabel}
                      </span>
                    </div>
                    
                    <h4 className={`text-xs md:text-sm font-black mt-2 leading-relaxed ${textStyle}`}>
                      {card.name}
                    </h4>
                    
                    <div className="font-mono text-[10px] text-slate-450 mt-1 text-ellipsis overflow-hidden whitespace-nowrap bg-slate-950/45 p-1 rounded px-2">
                      {card.expression}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-center py-16 bg-white/5 border border-dashed border-white/10 rounded-2xl space-y-2">
                <HelpCircle className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-500">没有查到符合条件的要点哦，换一个关键字试试吧？</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Immersive interactive sandboxed canvas blackboard! (Col: 8) */}
        <div className="lg:col-span-8 bg-[#0c1322]/85 rounded-[24px] border border-white/10 p-6 md:p-8 space-y-6">
          
          {/* Card Meta Description Header */}
          <div className="space-y-3.5 pb-5 border-b border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest">{activeCard.subjectLabel} 大纲必备点缀</span>
              </div>
              <span className="text-xs font-black px-3.5 py-1 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl tracking-wide">
                {activeCard.category}
              </span>
            </div>

            <h3 className="text-base md:text-lg font-black text-slate-100 select-text leading-snug">
              {activeCard.name}
            </h3>

            <p className="text-xs md:text-sm text-slate-350 leading-relaxed font-semibold">
              {activeCard.desc}
            </p>

            {/* Core Equation Blackboard banner */}
            <div className="bg-[#040813] border border-white/5 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3.5 shadow-inner">
              <div className="flex items-center gap-1.5 shrink-0">
                <Compass className="w-4 h-4 text-indigo-400 animate-spin-slow" />
                <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase">核心要义 / 核心公式：</span>
              </div>
              <span className="font-mono text-sm md:text-base text-amber-300 font-black tracking-wide text-right truncate select-text">
                {activeCard.expression}
              </span>
            </div>
          </div>

          {/* DYNAMIC COMPONENT 1: Interactive mathematical variables computation simulator */}
          {activeCard.variables && activeCard.calculate && (
            <div className="space-y-5">
              <div className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-black text-slate-300 tracking-wider">交互计算测试沙盒</span>
              </div>

              <div className="space-y-4">
                {activeCard.variables.map(v => (
                  <div key={v.symbol} className="bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs bg-blue-500/25 px-2.5 py-0.5 rounded text-blue-300 border border-blue-500/30">
                          {v.symbol}
                        </span>
                        <span className="text-xs md:text-sm font-black text-slate-200">{v.name}</span>
                      </div>
                      <p className="text-[10px] text-slate-450">标准物理学单位: {v.unit || "无"}</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {/* Dynamic Range Slider Helper */}
                      <input 
                        type="range"
                        min="0"
                        max={v.defaultValue ? v.defaultValue * 3 : 100}
                        step="0.1"
                        value={calcInputs[v.symbol] !== undefined ? calcInputs[v.symbol] : v.defaultValue}
                        onChange={(e) => {
                          setCalcInputs(prev => ({ ...prev, [v.symbol]: e.target.value }));
                          setCalcResult(null);
                        }}
                        className="w-24 sm:w-32 accent-blue-500 cursor-pointer h-1.5 rounded-lg bg-slate-900"
                      />
                      <input
                        type="number"
                        id={`sandbox-${activeCard.id}-${v.symbol}`}
                        value={calcInputs[v.symbol] !== undefined ? calcInputs[v.symbol] : v.defaultValue}
                        placeholder={v.placeholder}
                        onChange={(e) => {
                          setCalcInputs(prev => ({ ...prev, [v.symbol]: e.target.value }));
                          setCalcResult(null);
                        }}
                        className="w-24 p-2 bg-slate-950/80 border border-white/10 focus:border-blue-500 text-right font-mono text-xs font-bold rounded-lg text-white"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Sandbox Trigger Buttons */}
              <div className="flex gap-2.5 pt-1.5">
                <button
                  id="sandbox-btn-compute"
                  onClick={() => handleRunCompute(activeCard)}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white rounded-xl text-xs font-bold shadow-lg transition-transform active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                  立即触发模拟计算步骤
                </button>
                <button
                  id="sandbox-btn-reset"
                  onClick={handleResetCalc}
                  className="px-4.5 py-3 bg-white/10 hover:bg-white/15 text-slate-300 border border-white/5 rounded-xl text-xs hover:text-white transition-colors cursor-pointer"
                  title="清空"
                >
                  重置
                </button>
              </div>

              {/* Computation detailed review feedback */}
              {calcResult && (
                <div className="mt-6 border-t border-white/15 pt-5 space-y-4 animate-scale-up">
                  <div className="bg-blue-600/10 rounded-2xl p-4.5 border border-blue-500/25 flex items-center justify-between shadow-inner">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-blue-400 font-extrabold block uppercase tracking-wider">中考理科模拟演算结果：</span>
                      <div className="text-2xl md:text-3xl font-extrabold font-mono text-white tracking-widest mt-1">
                        {calcResult.value} <span className="text-xs font-sans font-normal text-slate-400 ml-1">({calcResult.unit})</span>
                      </div>
                    </div>
                    <span className="font-mono text-2xl font-black text-indigo-400 bg-indigo-500/10 px-4 py-2 rounded-xl border border-indigo-500/10">
                      =
                    </span>
                  </div>

                  <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                    <span className="text-[10px] font-black tracking-widest text-[#a5b4fc] block uppercase mb-3">📋 严谨的名师数理化公式推演步骤：</span>
                    <div className="space-y-2.5">
                      {calcResult.steps.map((step, idx) => (
                        <p key={idx} className="text-xs font-semibold text-slate-200 leading-relaxed flex items-center gap-2 select-text">
                          <CornerDownRight className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          {step}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DYNAMIC COMPONENT 2: Interactive humanities quiz deck */}
          {activeCard.interactiveQuiz && (
            <div className="space-y-4.5">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black text-slate-300 tracking-wider">科学人文考题互动沙盒</span>
              </div>

              <div className="bg-white/5 rounded-2xl p-5 border border-white/5 space-y-3.5">
                <span className="text-[10px] text-amber-300 bg-amber-500/15 border border-amber-500/20 px-2.5 py-0.5 rounded-lg font-bold">
                  思考小测试
                </span>
                <p className="text-xs md:text-sm font-extrabold text-slate-100 leading-relaxed">
                  {activeCard.interactiveQuiz.question}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {activeCard.interactiveQuiz.options.map((opt, oIdx) => {
                  const labelLetter = String.fromCharCode(65 + oIdx);
                  const isAnsweredOnCard = quizScore[activeCard.id] !== undefined;
                  const hasSelectedThisOpt = isAnsweredOnCard && quizScore[activeCard.id].chosenIdx === oIdx;
                  const isOptRight = oIdx === activeCard.interactiveQuiz?.correctIndex;

                  let optionStyle = "border-white/5 hover:bg-white/5 text-slate-200 hover:border-slate-500";
                  let prefixStyle = "bg-white/10 text-slate-300";

                  if (isAnsweredOnCard) {
                    if (isOptRight) {
                      optionStyle = "bg-emerald-500/15 border-emerald-500/40 text-emerald-300";
                      prefixStyle = "bg-emerald-500 text-white";
                    } else if (hasSelectedThisOpt) {
                      optionStyle = "bg-rose-500/15 border-rose-500/40 text-rose-300";
                      prefixStyle = "bg-rose-500 text-white";
                    } else {
                      optionStyle = "opacity-50 border-white/5 text-slate-400";
                    }
                  }

                  return (
                    <button
                      key={oIdx}
                      disabled={isAnsweredOnCard}
                      onClick={() => handleAnswerQuiz(activeCard.id, activeCard.interactiveQuiz!.correctIndex, oIdx)}
                      className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-3.5 group ${optionStyle}`}
                    >
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${prefixStyle}`}>
                        {labelLetter}
                      </span>
                      <span className="text-xs font-semibold leading-relaxed">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Quiz interactive explanation feedback report */}
              {quizScore[activeCard.id] && (
                <div className="bg-white/5 rounded-2xl p-5 border border-white/5 space-y-3 animate-scale-up">
                  <div className="flex items-center gap-2">
                    {quizScore[activeCard.id].correct ? (
                      <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 animate-bounce" />
                        恭喜答对！完全正确的常识要领！
                      </span>
                    ) : (
                      <span className="text-xs font-black text-rose-400 flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4" />
                        分析稍微偏航啦，先不要泄气，来看看下面的讲解：
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-semibold whitespace-pre-line select-text">
                    {activeCard.interactiveQuiz.explanation}
                  </p>
                  
                  <button
                    onClick={() => {
                      setQuizScore(prev => {
                        const copy = { ...prev };
                        delete copy[activeCard.id];
                        return copy;
                      });
                    }}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-extrabold cursor-pointer hover:underline block pt-1.5"
                  >
                    重新测试这道题 ↺
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SILLY TIPS / STRATEGY DRAWER DETAILS */}
          <div className="bg-[#050915] rounded-2xl p-5 border border-white/5 space-y-3.5 text-left">
            <span className="text-[10px] font-black tracking-widest text-[#a5b4fc] block uppercase">
              📚 学霸专属中考备考提分大秘籍：
            </span>
            <div className="space-y-2">
              {activeCard.tips.map((tip, i) => (
                <div key={i} className="text-xs text-slate-300 leading-relaxed font-semibold flex items-start gap-1.5">
                  <span className="w-4 h-4 rounded bg-indigo-500/25 text-[#a5b4fc] text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="select-text">{tip}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
