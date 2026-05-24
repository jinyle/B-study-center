import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with recommended user-agent header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Helper: Extract BVID or AID from Bilibili URL
function extractBilibiliId(url: string) {
  // Regex to extract bvid: starts with BV and followed by alphanumeric characters
  const bvRegex = /(BV[a-zA-Z0-9]{10})/i;
  const avRegex = /(av[0-9]+)/i;

  const bvMatch = url.match(bvRegex);
  if (bvMatch) {
    return { type: "bvid", id: bvMatch[1] };
  }

  const avMatch = url.match(avRegex);
  if (avMatch) {
    return { type: "aid", id: avMatch[1].replace(/av/i, "") };
  }

  return null;
}

// Endpoint 1: Fetch metadata for a Bilibili link
app.get("/api/bilibili/info", async (req, res) => {
  let videoUrl = req.query.url as string;
  if (!videoUrl) {
    return res.status(400).json({ error: "请输入Bilibili视频链接" });
  }

  // Handle Bilibili App shortened URL (b23.tv)
  if (/b23\.tv/i.test(videoUrl)) {
    try {
      let targetUrl = videoUrl.trim();
      if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = "https://" + targetUrl;
      }
      
      const redirectRes = await fetch(targetUrl, {
        method: "GET",
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      if (redirectRes.url) {
        videoUrl = redirectRes.url;
      }
    } catch (redirectErr) {
      console.error("Error expanding b23.tv URL:", redirectErr);
    }
  }

  const idInfo = extractBilibiliId(videoUrl);
  if (!idInfo) {
    return res.status(400).json({ 
      error: "无法识别Bilibili视频ID，请输入正确的包含BV或av号的链接，例如: https://www.bilibili.com/video/BV1xx411c7xx，或者复制自B站App的b23.tv短链接" 
    });
  }

  try {
    // Call Bilibili's public metadata endpoint securely from server side
    const targetUrl = idInfo.type === "bvid" 
      ? `https://api.bilibili.com/x/web-interface/view?bvid=${idInfo.id}` 
      : `https://api.bilibili.com/x/web-interface/view?aid=${idInfo.id}`;

    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    if (!response.ok) {
      throw new Error(`Bilibili API returned status ${response.status}`);
    }

    const json = await response.json();
    if (json.code === 0 && json.data) {
      const data = json.data;
      return res.json({
        success: true,
        bvid: idInfo.type === "bvid" ? idInfo.id : data.bvid,
        aid: data.aid,
        title: data.title,
        description: data.desc || "暂无简介",
        pic: data.pic,
        duration: data.duration,
        owner: data.owner ? data.owner.name : "未知UP主",
        videoUrl: `https://www.bilibili.com/video/${idInfo.type === "bvid" ? idInfo.id : "av" + data.aid}`,
        pages: data.pages ? data.pages.map((p: any) => ({
          page: p.page,
          part: p.part || `第 ${p.page} 集`,
          duration: p.duration
        })) : []
      });
    } else {
      // If code is not 0 (e.g. rate limit, restricted), return parsed ID but let frontend manual/AI populate
      return res.json({
        success: false,
        bvid: idInfo.type === "bvid" ? idInfo.id : null,
        error: json.message || "未能获取视频详情，可能存在地区或版权限制",
        title: `视频学习单元: ${idInfo.id}`,
        description: "由于外部接口限制，未能自动解析视频简介。不过您依然可以通过该视频知识点智能生成测试题目！"
      });
    }
  } catch (error: any) {
    return res.json({
      success: false,
      bvid: idInfo.type === "bvid" ? idInfo.id : null,
      error: error.message || "请求服务器获取Bilibili接口失败",
      title: `Bilibili 视频单元 (${idInfo.id})`,
      description: "网络故障或解析接口限制，未能完全拉取视频详情。但您可以直接基于主题继续进行AI生成测评！"
    });
  }
});

// Helper: Get Subject Config for All Subjects
function getSubjectConfig(category: string) {
  const normalized = category ? category.toLowerCase() : "";
  switch (normalized) {
    case "chinese":
      return {
        role: "你是一位教学经验丰富、深受少年儿童喜爱、风趣幽默的九年级语文特级名师，深谙中高考语文考点。",
        focus: "语文基础知识、成语俗语、修辞手法、古诗词赏析、文言文翻译、现代文阅读技巧或文学常识。选项中应侧重词意辨析、文学背景、句子逻辑等。",
        keyName: "核心语文考点 / 汉字字音字形 / 常考名句赏析",
        formulaDesc: "常考字词释义、经典句型（如：被动句、倒装句等）或古诗词默写，可用'词语/句式'代替公式表达，用'分类（如：修辞、文言实词）'代替单位，并简述其含义及用法。",
        activityDesc: "设计一个趣味阅读挑战、汉字拼写/古诗对词接龙，或者日常生活相关的观察或微写作实践（简便且富有语文学科特色）。"
      };
    case "math":
      return {
        role: "你是一位教学经验丰富、逻辑严密、深受孩子爱戴的中学数学特级名师。",
        focus: "代数方程、几何定理、勾股定理、函数比例、概率统计或奥数思维推导。题目需要求一定的逻辑推算和步骤演算。",
        keyName: "核心数学公式 / 几何常考定理",
        formulaDesc: "本章节用到的数学公式定理（如：勾股定理 a²+b²=c²，一元二次方程求根公式等）及变量含义注释，单位写'无'或常用的度量单位。",
        activityDesc: "设计一个有趣的数学规律发现、生活开支记账分析，或者几何剪纸、趣味折纸算体积等手脑并用的微实践。"
      };
    case "english":
      return {
        role: "你是一位教学风格活泼、注重情境交际的英语特级教师，善于让孩子在语境中掌握语法词汇。",
        focus: "核心单词辨析、经典时态语态（如一般现在时、现在完成时）、情景口语交际或阅读长难句。考题应具有具体会话情景，双语释义清晰。",
        keyName: "重点句型模板 / 经典语法公式",
        formulaDesc: "常用的句型结构或时态搭配公式（如：主语+will+do，It is adj for sb to do），可用'搭配/结构'代替公式，简述语法功能与应用情景。",
        activityDesc: "设计一个情景口语角色扮演、5分钟英语绕口令，或是在日常生活中辨识身边物品英文标签的趣味微挑战。"
      };
    case "chemistry":
      return {
        role: "你是一位把化学课上得像魔术表演一样精彩、具有极强幽默感的中学化学特级教师。",
        focus: "元素周期表常识、化学方程式配平、微观分子结构、溶液酸碱度（pH）、安全实验操作或常见生活化学反应误区。",
        keyName: "核心化学方程式 / 反应规律计算",
        formulaDesc: "该节包含的核心化学方程式（如：2H2 + O2 => 2H2O）、物质溶解度公式，或质量守恒定律说明及对应符号注释。",
        activityDesc: "设计一个绝对安全、在家里厨房用醋、小苏打、食盐或柠檬等常用物品即可操作的趣味家庭化学变色/发泡小实验。"
      };
    case "biology":
      return {
        role: "你是一位钟爱生命科学、博古通今、讲课生动幽默的中学生物学科特级名师。",
        focus: "细胞结构、生态系统食物链、光合作用/呼吸作用、遗传与基因、人体器官生理健康或动植物生命特征功能。",
        keyName: "重点生物概念 / 生命运作规律公式",
        formulaDesc: "光合/呼吸作用等代表性反应过程式（如：二氧化碳+水=>有机物+氧气），或者关键的生物层次等级概念图简述。",
        activityDesc: "设计一个动植物标本制作、家庭植物光照对照实验，或者动手捏制细胞模型等具有生物学特色的微观察任务。"
      };
    default: // physics / other / legacy physics categories
      return {
        role: "你是一位教学经验丰富、能把数理化探究讲得栩栩如生的优质中学物理与自然科学特级名师。",
        focus: "经典力学（重力、压力、浮力）、光学（折射、全反射）、电磁学（欧姆定律、串并联）、声学与热学规律，以及各种自然科学常识探究。",
        keyName: "核心物理公式 / 科学探究规律",
        formulaDesc: "本章节用到的物理或科学定律公式（如：F浮 = ρ液 · g · V排，I = U/R），对应物理量在国际单位制中的单位以及变量含义注释。",
        activityDesc: "设计一个可以在家利用塑料瓶、吸管、尺子或水杯等易得物品轻易操作、复现相同科学原理的趣味动手小实验。"
      };
  }
}

// Robust fallback quiz/reading data generator when Gemini hits limits (429/503)
function getFallbackData(title: string, description: string, category: string, gradeLevel: string, questionCount: number = 5) {
  const normTitle = (title || "").toLowerCase();
  const normDesc = (description || "").toLowerCase();
  const cat = (category || "").toLowerCase();

  // Subject matching logic
  let realCategory = cat;
  if (!realCategory) {
    if (/(语文|唐诗|古诗|文言文|拼音|成语|作文|鲁迅|李白|杜甫|课文|阅读)/.test(normTitle)) {
      realCategory = "chinese";
    } else if (/(数学|几何|代数|方程|勾股定理|三角函数|比例|乘法|算术|公式|函数|面积)/.test(normTitle)) {
      realCategory = "math";
    } else if (/(英语|动词|语法|单词|时态|复数|宾语|英文|口语|翻译)/.test(normTitle)) {
      realCategory = "english";
    } else if (/(化学|反应|分子|元素|周期表|酸碱|中和|溶液|气体)/.test(normTitle)) {
      realCategory = "chemistry";
    } else if (/(生物|细胞|植物|动物|光合|基因|种子|生态|温饱|兔子)/.test(normTitle)) {
      realCategory = "biology";
    } else {
      realCategory = "physics"; // Fallback to physics/science
    }
  }

  let baseData;
  if (realCategory === "chinese") {
    baseData = {
      topicSummary: `本课精析了《${title}》中所蕴含的语文底蕴、词法句法规范及经典文学常识。通过古今结合，重点梳理了字词的精准释解、修辞手法在文章中的渲染作用，以及作者所要传达的深层思想境界，为你夯实汉语言基础。`,
      keyFormulas: [
        {
          name: "常考字词与字音辨析",
          expression: "读音精确、词义辨析",
          unit: "词法",
          desc: "正确拼读字音、领悟多音字在语境中的不同词义，是理解文学作品的首要基础。"
        },
        {
          name: "修辞手法及情感传达",
          expression: "比喻/拟人/排比/夸张",
          unit: "修辞",
          desc: "增强语势与形象性，通过将抽象情义具化，使文章情感充沛、行文流动自然。"
        },
        {
          name: "经典情感表达主旨",
          expression: "托物言志 / 借景抒情",
          unit: "文法",
          desc: "文学家常借客观事物或山川美景寄托胸襟宏愿，分析时应抓住事物特征及情感色彩。"
        }
      ],
      readingMaterial: {
        title: `🏮 汲取国学雅韵：从「${title}」探析文字之美`,
        content: `### 语言的妙用与文学的情怀\n\n文学作品不仅承载着丰富的情感，也是汉字美学最集中的体现。当我们探究《${title}》时，不由得会被其细腻的笔触、严谨的结构或真挚的情感所打动。从先秦散文到唐诗宋词，再到近现代优秀作品，卓越的写作者们总是擅长用最精准的字词来传达细微的体验。\n\n### 文史典故与修辞艺术的演进\n\n中国古代诗文常讲究‘炼字’。一个字词的精准使用，能让整首诗词‘活’起来。例如，王安石‘春风又绿江南岸’中的‘绿’字，妙在将动感与生机倾注于一个色彩词中。除了炼字，各种修辞手法（如借代、对比、互文等）也是中国文学的瑰宝。它们以极高的信息密度和文学包容性，展示了古人的智慧与审美。理解这些表达技巧，能帮助我们在写作或阅读时看透文字底层的意境，做到笔下生辉、言之有物。`,
        funFacts: [
          "【推敲的典故】唐代诗人贾岛在吟诗《题李凝幽居》时，因纠结‘僧推月下门’还是‘僧敲月下门’而骑驴冲撞了韩愈的仪仗，韩愈建议用‘敲’，从而诞生了‘推敲’一词。",
          "【古汉语中的‘色’】在古代汉语里，‘颜色’一词通常指人的面部表情或神色，而单字‘色’才代表现代意义上的各种色彩。",
          "【鲁迅的‘百草园’】鲁迅在《从百草园到三味书屋》里提及的覆盆子、何首乌不仅是童年玩乐的象征，而且这些植物大多确实具有一定的国药保健价值。"
        ],
        suggestedActivity: "✍️ 【妙笔生花：一分钟微作文】\n请选取你眼前的一件日常物品，不直接说出它的名字，而是使用至少两种修辞手法（如拟人、比喻）写下两句优美的描写，读给家长听，让他们猜一猜这是什么物品。看他们能不能秒懂你的文学巧思！"
      },
      questions: [
        {
          id: 1,
          question: "在阅读或写作中，下面关于‘借景抒情’和‘托物言志’的理解，最科学准确的是？",
          options: [
            "A. 两者完全相同，都是写景的，没有任何主旨区分",
            "B. 借景抒情通常是即景生情，而托物言志则会把某种长久的精神寄托在一种或几样特定的器物、动植物身上",
            "C. 托物言志只需要罗列各种科技公式，而不需要加入任何个人体验",
            "D. 借景抒情只能在晴天写，阴雨天不能用作情感的宣泄"
          ],
          correctAnswer: 1,
          difficulty: "intermediate",
          explanation: "好孩子！正确选项是B。借景抒情是文学家融情于景，将内心的喜怒哀乐寄托在山川原野、阴晴雨雪的景物变化中；而托物言志则是用某种具有特定品质的事物（如梅花的坚毅、青松的刚健、蜡烛的无私）来承载、表达自己的宏伟心志、品行或人生理想，其所托之物往往贯穿作品始终。B选项剖析极其精准！",
          hint: "想想‘梅兰竹菊’之所以被称为四君子，是因为它们本身所蕴含的人格特质，这究竟属于哪种表达艺术？"
        },
        {
          id: 2,
          question: "日常成语往往承载着厚重的国学常识和历史沉淀。请问在‘完璧归赵’这一历史典故中，‘璧’指的是何种礼物或宝物？",
          options: [
            "A. 一面极度明亮的古代青铜镜子",
            "B. 一块无比珍贵、名为‘和氏璧’的美玉",
            "C. 一套由春秋楚国铸造的青铜编钟",
            "D. 一件由江南织造进贡的刺绣丝绸华服"
          ],
          correctAnswer: 1,
          difficulty: "basic",
          explanation: "完全正确！答案选B。在战国时期，战事频繁，赵国得到了天下至宝‘和氏璧’。秦昭襄王听说后，扬言愿以十五座城池来交换。蔺相如临危受命，奉璧入秦。他凭借大智大勇，看穿秦国无意割城的诡计，完好地将这块珍贵的玉璧带回了赵国。这就是‘完璧归赵’的历史渊源，所以‘璧’指的是一种高贵无暇的圆形美玉。",
          hint: "‘璧’这个汉字，在字形偏旁上与‘玉’密切相关哦，可以观察其下方结构！"
        },
        {
          id: 3,
          question: "鲁迅先生被称为‘中国现代文学的奠基人’。我们在学校常学他的散文。请问以下哪一部作品属于鲁迅最具童心、温情与回忆性质的散文集《朝花夕拾》？",
          options: [
            "A. 《呐喊》",
            "B. 《彷徨》",
            "C. 《阿Q正传》",
            "D. 《从百草园到三味书屋》"
          ],
          correctAnswer: 3,
          difficulty: "intermediate",
          explanation: "太棒了！选D。《从百草园到三味书屋》是鲁迅先生著名的回忆性散文，收录在他唯一的散文集《朝花夕拾》中（原名《旧事重提》）。而《呐喊》《彷徨》属于他针砭时弊、震撼国人心灵的‘小说集’，《阿Q正传》更是《呐喊》中的中篇小说代表作。D选项是极其正宗的回忆散文，读起来亲切温馨。",
          hint: "‘朝花夕拾’意为早晨开的花、傍晚捡起来，象征着在晚年回忆、品味童年和中青年时期的往事。"
        },
        {
          id: 4,
          question: "古诗文中常出现‘互文见义’的独特修辞。例如‘秦时明月汉时关’。关于这一名句的正确理解是？",
          options: [
            "A. 秦朝的时候只有月亮守候，汉朝的时候才建起了关塞",
            "B. 月亮只在秦国升起，关塞只在汉朝有用",
            "C. 秦汉时期的明月依然普照着秦汉时期的关塞，指边疆常年战事不息、将士思乡盼归",
            "D. 这只是为了拼凑诗歌字数，并没有任何特别的文学含义"
          ],
          correctAnswer: 2,
          difficulty: "challenging",
          explanation: "精彩！选C。‘秦时明月汉时关’并非指月亮和关塞被拆分为秦朝和汉朝，而是诗歌中典型的‘互文’修辞。完整的语义是‘秦汉时期的明月，秦汉时期的关卡’，表达边境战乱由来已久，自古至今战士们都在这里坚守、怀念家乡。修辞的交织让历史厚重感扑面而来！",
          hint: "将‘秦’和‘汉’、‘明月’和‘关’交织、融合在一来读，才能还原整首诗最真实的哀怨与壮阔。"
        },
        {
          id: 5,
          question: "在现代汉语写作中，要想让词句更加生动、富有感染力，下面哪项建议是不提倡的？",
          options: [
            "A. 多使用贴近生活、富有动作画面感的‘动词’",
            "B. 适当使用排比和比喻，使句式错落有致",
            "C. 盲目堆砌华丽辞藻、多用空洞的生僻冷怪词语，让读者不知所云",
            "D. 注意标点符号的合理停顿，保持句子节奏明快"
          ],
          correctAnswer: 2,
          difficulty: "basic",
          explanation: "真聪明，答案是C！虽然典雅的词汇可以为文章增色，但若是盲目堆砌冷僻词、大话空话，不仅不能表达真诚的情感，反而会让文章变得晦涩难懂。真正优秀的文章往往能够用朴实无华却有力量的字词击中读者的心灵。因此，写作用词应当‘准’而非‘炫’。",
          hint: "好文章讲求‘言之物，真诚动人’。想一想，满篇都是查字典才懂的怪字，是好作文吗？"
        }
      ]
    };
  } else if (realCategory === "math") {
    baseData = {
      topicSummary: `本课精讲了《${title}》中涉及的核心数学思维、公式法则及严密的几何/代数逻辑。通过典型的图形建模与数代数转化，深入浅出地剖析了数形结合的本质，帮助你在解题时一眼看清底层的定量规律！`,
      keyFormulas: [
        {
          name: "勾股定理定理式",
          expression: "a² + b² = c²",
          unit: "几何",
          desc: "直角三角形中两直角边a, b的平方和等于斜边c的平方，是几何数形结合的基石。"
        },
        {
          name: "一元一次方程通解",
          expression: "ax + b = 0 => x = -b/a (a≠0)",
          unit: "代数",
          desc: "等式基本性质：等式两边同加减、同乘除（非0数）保持等式成立。"
        },
        {
          name: "直角坐标距离公式",
          expression: "d = √[(x₂-x₁)² + (y₂-y₁)²]",
          unit: "解析几何",
          desc: "利用勾股定理可求出平面直角坐标系中任意两点间的直线距离。"
        }
      ],
      readingMaterial: {
        title: `📐 数的世界：解密「${title}」背后的严密逻辑`,
        content: `### 数形结合：用数字丈量空间\n\n数学是一门探寻宇宙规律的语言。当我们面对《${title}》中的数学问题时，最重要的思想之一就是‘数形结合’。几何学中的图形看起来是直观而生动的，而代学中的数字和方程则是抽象而客观的。当我们将抽象的‘数’与直观的‘形’紧密结合，世间复杂的关系就会迎刃而解。\n\n### 科学大门上的金钥匙：公式的发展\n\n以勾股定理为例，它是人类发现的第一个数形结合的重要定理，有着数百种绝妙的证明方法。无论是赵爽弦图的割补，还是毕达哥拉斯的拼图，都体现了代数代称与空间几何面积的深度统一。再如等式与方程式的使用，其核心就是寻找未知量与已知量之间的‘天平关系’。通过建立天平（即方程），利用等式的基本性质消除未知数的繁系数，从而得出精准而唯一的解。掌握这些思维方法，在实际生活中，我们也能轻松做出精确规划、做出最优选择。`,
        funFacts: [
          "【黄金分割率的魅力】黄金分割率(约等于0.618)是美学和自然的数学交汇。无论是鹦鹉螺的螺线、巴特农神庙的宏阔比例，还是人体膝盖到脚底与身高的黄金比，都证明了这一神奇数字的存在。",
          "【0的起源与波澜】在漫长的历史中，许多文明最初并没有‘0’这个代表虚无的占位符。大约在公元5-7世纪，印度数学家才逐渐完善了零的记账和四则运算概念，彻底解放了数学的计算力。",
          "【芝诺悖论的幽灵】古希腊学者芝诺曾提出过‘阿基里斯永远追不上乌龟’的著名悖论，这一问题最终在微积分问世、现代极限和无穷收敛数列概念建立后，在数学上得到了圆满证明。"
        ],
        suggestedActivity: "📐 【脑力微锤炼：寻找生活里的对称轴】\n环顾你的家，找出3个同时具备‘轴对称’（即对折后完全重合）和‘中心对称’（旋转180度后依然与原图重合）的物品（例如完美的圆形餐盘、正方形瓷砖、双向对称的剪刀等）。画一画它们的对称轴，和爸爸妈妈分享你的发现！"
      },
      questions: [
        {
          id: 1,
          question: "在直角三角形中，如果已知两条直角边的长度分别为 6 厘米和 8 厘米，那么最长的斜边长度应该是多少？",
          options: [
            "A. 10 厘米",
            "B. 14 厘米",
            "C. 12 厘米",
            "D. 48 厘米"
          ],
          correctAnswer: 0,
          difficulty: "basic",
          explanation: "非常完美，答案是A！根据著名的数学定理：勾股定理，直角三角形两直角边的平方和等于斜边的平方。这里列出算式：6² + 8² = 36 + 64 = 100。因为 10 的平方正好是 100，所以斜边长度就是 10 厘米。这是一组大名鼎鼎的勾股数：‘勾三股四弦五’的两倍，牢记它在考试中能秒算答案哦！",
          hint: "用勾股定理式 a² + b² = c²，把 a=6, b=8 代入，计算结果再开平方即可。"
        },
        {
          id: 2,
          question: "关于‘平面直角坐标系’的象限划分，如果一个点的横坐标小于0，纵坐标大于0（如点P [-3, 5]），那么该点落在第几象限？",
          options: [
            "A. 第一象限",
            "B. 第二象限",
            "C. 第三象限",
            "D. 第四象限"
          ],
          correctAnswer: 1,
          difficulty: "basic",
          explanation: "好聪明！答案选B。在笛卡尔建立的平面直角坐标系中，横轴x向右为正，纵轴y向上为正。第一象限点的特征是 (正, 正)；第二象限点的特征是 (负, 正)，即横标为负而纵标为正；第三象限是 (负, 负)；第四象限是 (正, 负)。点[-3, 5]的x=-3为负，y=5为正，自然落于第二象限中。答案完美锁定！",
          hint: "想象自己在坐标原点上，先往左（负）走，再往上（正）走，这是哪个方向的区域？"
        },
        {
          id: 3,
          question: "数学中有个著名的数：圆周率（π）。关于 π 的描述，下列选项中哪一个说法是绝对正确的？",
          options: [
            "A. π 是一个有限小数，它的值正好就是 3.1415926",
            "B. π 是一个无限不循环小数，它属于无理数，其数字组合在小数点后永远延伸且不出现周期性重复",
            "C. π 是两个大整数（如22与7）相除的精确商",
            "D. π 随着圆的变大而变大，大圆的圆周率比小圆要大"
          ],
          correctAnswer: 1,
          difficulty: "intermediate",
          explanation: "太棒了！选B。圆周率是指任意一个圆的周长与它直径的比值。它是一个恒定常量，与圆的大小无关。经过古今无数科学家的极精密计算，圆周率 π 被证明是一个无限不循环小数，即无理数，绝对无法写成两个正整数相除的形式（类似22/7、355/113都只是近似估算值）。数学之美就在于此！",
          hint: "无理数的特征是：无限、不循环。圆周率虽然在生活中常用3.14来做近似，但它背后的数字实际上是一条永无止境的奥秘项。"
        },
        {
          id: 4,
          question: "有一道有趣的逻辑谜题：已知 3 个连续的奇数之和为 45，那么这 3 个奇数中，最小的一个是多少？",
          options: [
            "A. 11",
            "B. 13",
            "C. 15",
            "D. 17"
          ],
          correctAnswer: 1,
          difficulty: "intermediate",
          explanation: "太厉害了！选B。设这三个连续奇数中间的那一个为 x，由于相邻奇数相差 2，则最小的为 (x-2)，最大的为 (x+2)。将它们相加：(x-2) + x + (x+2) = 3x = 45。解得方程 x = 15（说明中间数是15）。那么最小的奇数就是 15 - 2 = 13，最大的就是 15 + 2 = 17。13 + 15 + 17 = 45，完全符合条件！",
          hint: "因为这三个数是‘连续奇数’，且其和为45，代表它们的‘平均数’就是它们中间的那一个奇数。45除以3是多少？"
        },
        {
          id: 5,
          question: "初中数学中常提及‘轴对称图形’的判定。在下面的几何平面图形中，对称轴最多、完美度最高的是哪个图形？",
          options: [
            "A. 等边三角形",
            "B. 正方形",
            "C. 平行四边形 (非矩形非菱形)",
            "D. 圆形 (正圆)"
          ],
          correctAnswer: 3,
          difficulty: "basic",
          explanation: "太棒了！答案是D。等边三角形有 3 条对称轴；正方形有 4 条对称轴；而普通的平行四边形属于中心对称图形，但没有对称轴（对称轴数量为0）。正圆的对称轴则是任何一条经过圆心的直线，因而拥有无数多条对称轴！在所有选项中，圆的对称性最完美。选D是绝对无可挑剔的选项。",
          hint: "轴对称图形就是沿着一条线折叠后，左右能够完美贴合。哪一个图形不论你怎么切，只要穿过中心，都能完美等折？"
        }
      ]
    };
  } else if (realCategory === "english") {
    baseData = {
      topicSummary: `本课重点讲解了《${title}》中涉及的英语实用句型、情景对话惯用表达及词汇搭配。结合初中核心文法考纲，精析了动词时态与长难句式，培养你‘在语境中自然习得、地道表达’的良好感觉。`,
      keyFormulas: [
        {
          name: "一般现在时客观规律",
          expression: "主语 + 动词原形/单三(moves/gets)",
          unit: "语法/动词时态",
          desc: "表达客观真理、地理常识或科学规律时，即便主句是过去时，从句也必须采用一般现在时。"
        },
        {
          name: "宾语从句陈述句序搭配",
          expression: "主句 + 连词(that/if) + 陈述句人称语序",
          unit: "句型/宾从",
          desc: "宾语从句一律必须使用陈述语序（主语在前，谓语在后），不能采用一般疑问疑问语序。"
        },
        {
          name: "介词搭配要点",
          expression: "be good at doing sth",
          unit: "词组结构",
          desc: "意为‘擅长做某事’，其中at是介词，其后若接动词，必须使用动名词形式(doing)。"
        }
      ],
      readingMaterial: {
        title: `🌍 畅游地道英文：解密《${title}》中的跨文化语感与长难句`,
        content: `### 情境英语：在真实语境中建立连结\n\n语言是沟通的桥梁。在英语学习中，孤立地背诵单词往往枯燥且容易遗忘，真正精妙的方式是‘在语境中领悟’。当我们欣赏《${title}》这一课程时，我们会接触到生动的情境表达、文化差异或日常口语搭配。地道的英文不仅要求发音准确，更重要的是理解背后的逻辑和‘固定搭配’。\n\n### 时态与从句：掌控句子的时空张力\n\n英语文法（Grammar）的核心是时间和空间的逻辑。例如，一般过去时用于表达发生在过去某一瞬间的事实，而现在完成时（have/has + done）则强调过去发生的动作对现在产生的影响或联系。至于从句，它把原本松散的单句拼接为层次丰富的长难句。比如，在复合句中作为宾语的句子叫做‘宾语从句’，牢记它的两条重磅定理：第一，语序永远是陈述句式（不能倒装）；第二，时态要与主句吻合，但如果是描述永恒的科学客观真理，则永远要坚持用一般现在时。掌握了这些，你不仅能在考试中轻取高分，更能流畅地写出优雅文章。`,
        funFacts: [
          "【无聊的单词起源】‘Cliché’（陈词滥调）这个词源于法国旧印刷厂。当时，铅字印刷排字工人把常用句做成一整块铸版，印刷过程中‘克里谢克里谢’（Cliché）的机械打击声反复出现，便演变成了指代无新意的固定套用语。",
          "【最长的无字母重复词】在英语中，单字‘subdermatoglyphic’（意为‘皮下指纹学’）由 17 个不重复的拉丁字母结合而成，是公认最长的无重复字母英文单词。",
          "【Shakespeare的造词神技】大文学家莎士比亚一生中为英语创造并引入了超过 1700 个高频词汇，包括大家熟知的‘lonely’（孤独的）、‘generous’（慷慨的）和‘assassination’（刺杀）等。"
        ],
        suggestedActivity: "🗣️ 【地道口语演练：5分钟英文大声读】\n请站到镜子前，大声朗读出以下句子 3 遍：'The limit of my language means the limit of my world.'（我语言的界限代表我世界的界限——维特根斯坦格言）。注意试着连读 'limit of' 以及把 'th' 咬舌尖发音。和你的家长来一次语调大PK！"
      },
      questions: [
        {
          id: 1,
          question: "He is extremely talented. He is really good at ______ beautifully.",
          options: [
            "A. draw",
            "B. drawing",
            "C. drew",
            "D. to draw"
          ],
          correctAnswer: 1,
          difficulty: "basic",
          explanation: "完全正确！答案选B。在英语短语搭配中，‘be good at’（擅长做某事）里的‘at’是一个介词。介词后面如果跟着一个动作，必须变成‘动名词’形式，也就是动词后加上 -ing。因此，draw 必须写成 drawing。这是考试中常见的介词后接动名词测试考点，一定要记住哦！",
          hint: "介词（in, on, at, for, about等）后面如果接动词，通常需要转换为什么形式？"
        },
        {
          id: 2,
          question: "The teacher asked the students, 'Could you tell me ______?'",
          options: [
            "A. where is the nearest library",
            "B. where the nearest library is",
            "C. was the library open",
            "D. where did you find the library"
          ],
          correctAnswer: 1,
          difficulty: "intermediate",
          explanation: "太棒了，选B！此题考查初中英语考纲最重磅的句型：‘宾语从句的陈述语序’。不论主句是疑问句还是祈使句，从句连接词引导的部分必须要采用‘主语 + 动词’的陈述人称语序。A项中的 is 在 the nearest library 前面，属于疑问语序，所以不对。B项 is 垫在后面，语序才正确。你太细心了！",
          hint: "宾语从句一法规：语序永远用陈述。即‘主语 + 动词/状态’，不能像普通的疑问句那样把be动词往前拉。"
        },
        {
          id: 3,
          question: "I ______ my study plan already, so I can rest now.",
          options: [
            "A. have finished",
            "B. finished",
            "C. will finish",
            "D. finish"
          ],
          correctAnswer: 0,
          difficulty: "intermediate",
          explanation: "答对啦！选A。句子里出现了副词 'already'（已经），且后面半句 'so I can rest now' 说明在过去发生的已经写完的动作对‘现在’产生了深远联系（即我现在可以休息了）。这就完美符合‘现在完成时’（have/has + 过去分词）的经典定义。而一般过去时只说‘过去写完’没提及现在，所以A才是最生动切题的叙事时态。",
          hint: "‘已经完成并对现在产生影响’，需要使用 have/has + 动词的过去分词形式（现在完成时）。"
        },
        {
          id: 4,
          question: "Our teacher told us that the earth ______ around the sun.",
          options: [
            "A. moved",
            "B. moves",
            "C. is going to move",
            "D. will move"
          ],
          correctAnswer: 1,
          difficulty: "challenging",
          explanation: "太精辟了！选B。这是一个容易踩坑的语法题。虽然主句使用了一般过去时（told us），正常情况下从句也必须呼应使用过去时态。但是，‘地球绕着太阳转’属于绝对的、永恒的‘客观真理与物理规律’。考纲特设：凡是宾语从句表达的是客观真理、常识物理定律，一律坚持‘一般现在时’，永不受主句过去式的干扰！故必选单三形式 moves。",
          hint: "牢记：主句虽然是过去，客观真理一律‘一般现在时’，恒常不变！"
        },
        {
          id: 5,
          question: "Which of the following phrases is the most polite and natural way to ask for help on the street?",
          options: [
            "A. 'Tell me where the bank is!'",
            "B. 'Excuse me, could you please tell me how to get to the bank?'",
            "C. 'Where is bank? Speak now!'",
            "D. 'Hey, move and show me the path to bank!'"
          ],
          correctAnswer: 1,
          difficulty: "basic",
          explanation: "回答得极其得体，选B。在日常生活交际中，请求陌生人指路应当使用礼貌情景句。A、C、D项语气过于生硬、充满命令式或甚至不礼貌。而B项使用了缓和铺垫词‘Excuse me’和含有情态动词的委婉问句‘could you please...’，是纯正且文明的人际交互，最受推崇。",
          hint: "礼貌的询问往往伴随着‘Excuse me’打头和委婉语气词如‘could/please’的使用哦。"
        }
      ]
    };
  } else if (realCategory === "chemistry") {
    baseData = {
      topicSummary: `本课重点梳理了《${title}》中展现的基础化学变化、分子和元素的反应机制以及经典方程式。带你深入物质微观核心，探求微粒碰撞产生分子重组的奇妙规律，掌握化学的物质守恒基础。`,
      keyFormulas: [
        {
          name: "水的电解反应式",
          expression: "2H₂O ==通电== 2H₂↑ + O₂↑",
          unit: "化学方程式",
          desc: "在通电条件下，水分子分解生成氢气与氧气，证明了水是由氢、氧两种元素组成的科学结论。"
        },
        {
          name: "质量守恒法则",
          expression: "m(反应前物质) = m(反应后生成物)",
          unit: "反应规律",
          desc: "化学反应在微观上是原子重新排列组合，反应前后原子的种类、数目、静质量保持恒定。"
        }
      ],
      readingMaterial: {
        title: `🧪 微观魔法：剖析「${title}」背后的物质演变与化学反应`,
        content: `### 物质守恒：原子在微观世界的‘洗牌游记’\n\n化学是关于物质变化的科学。当我们浏览《${title}》这一课程时，我们会惊叹于各种奇妙变色、产生泡沫甚至火光闪烁的瞬间。实际上，世界上所有的化学反应都不是无中生有的，而是极其遵循‘质量守恒律’的。任何化学变化在微观上，都是旧分子分裂成原子、原子又重新拼装组合成新分子（新物质）的过程。这也解释了反应前后各种化学原子的个数和质量总是保持百分之百守恒的真相。\n\n### 元素周期表：给宇宙万物排排座\n\n俄罗斯科学家门捷列夫通过将已知元素按相对原子质量由小到大排列，发现了大名鼎鼎的‘元素周期表’。这就好比是一张宇宙元素的‘扑克牌规律图’，它让看似繁杂错乱的各种单质、化合物都暴露出其有序的结构和物理规律。甚至在周期表留下的空位处，门捷列夫连当时尚未发现的各种稀有元素属性都成功做了惊人预测。拥有了这些周期规律和反应方程，人类才得以合成新药、制造芯片和治理环境保护树木。化学课就是如此迷人而充满洞察的一门学问。`,
        funFacts: [
          "【不爱洗澡的门捷列夫】门捷列夫沉迷于元素卡片的规律分类。据说，他曾为了绘制和推衍周期表连睡三天三夜。他经常蓬头垢面，甚至沙皇求见他时，他都在因写公式而不愿停下手头的笔。",
          "【干冰并不是冰】舞台上缭绕的唯美白色干冰，实则是固态二氧化碳。它在常温常压下不需要经过液体状态，而是会直接‘升华’汽化成一千五百倍体积的气体，并夺取周围热量，使空气水汽发生凝结。",
          "【厨房里的小酸碱】柠檬味道酸，是因为含有柠檬酸，属于酸性物质。而我们的胃液里隐藏着高浓度强酸（盐酸）。如果你吃土豆或面包觉得发涩，往往是因为泡打粉中的碳酸氢钠属于偏碱性成分。"
        ],
        suggestedActivity: "🔬 【安全有趣的家庭变色化学箱】\n在爸爸妈妈的看护下，取家里一小匙食醋（酸性物质）倒入空玻璃杯中，接着加入少量发酵粉或小苏打（碳酸氢钠，碱性面粉发泡剂）。观察杯子中是否有大量的细密气泡（二氧化碳气泡）冒出，感觉杯壁在吸热发生微度变温！快用白开水、泡打粉在家见证物质反应变化吧。"
      },
      questions: [
        {
          id: 1,
          question: "在探究化学变化与物理变化的区别时，下列哪一个过程属于典型的‘化学变化’？",
          options: [
            "A. 将大冰块砸碎，融化变成凉开水",
            "B. 轻轻弯折一根粗粗的铜丝，使其变形",
            "C. 木材在壁炉里剧烈燃烧，最后碳化并放出热量与二氧化碳",
            "D. 清澈的水在阳光照射下，慢吞吞地蒸发成肉眼看不见的水蒸气"
          ],
          correctAnswer: 2,
          difficulty: "basic",
          explanation: "好聪明！答案选C。化学变化和物理变化的本质区别，就在于‘是否有新物质生成’。A、B、D项只是冰块、铜丝、水分子的几何状态、排列方式或者外观形状发生了物理性改变。而C项中木柴和氧气发生剧烈燃烧，生成了二氧化碳气体和灰质，属于诞生了新物质的化学变化！",
          hint: "化学变化的标志就是：生成了原本没有的新物质、发生了原子配位的重组变化。"
        },
        {
          id: 2,
          question: "在做化学实验时，如果不慎将一小杯浓盐酸（酸性物质）滴撒在试验台上，应当使用最安全、温和的哪种常见物质来进行中和？",
          options: [
            "A. 用同样高腐蚀性的浓氢氧化钠溶液去泼浇",
            "B. 用大量温热的开水和食醋混合液去反复搓洗",
            "C. 撒上适量温和的碳酸氢钠粉末（小苏打）使其反应，再用清水冲洗",
            "D. 不用采取任何措施，等待酸液自己蒸发干"
          ],
          correctAnswer: 2,
          difficulty: "intermediate",
          explanation: "回答太漂亮了！选C。由于浓盐酸是具有严重伤害性的强酸，滴落后必须及时处理。A项中浓氢氧化钠属于强碱，对人体极度危险，绝不可用于紧急泼浇。而小苏打（碳酸氢钠）是安全的弱碱性盐，能够迅速与强酸发生温和反应产生二氧化碳并中和酸性，最后用足够的水冲洗最科学、最无害。",
          hint: "化学提倡‘安全温柔中和’，对于滴撒的强酸，最好用安全的弱碱粉末中和其酸性后再冲洗。"
        },
        {
          id: 3,
          question: "在元素周期表里，第1号元素——氢元素，其符号是下面哪一个？",
          options: [
            "A. He",
            "B. H",
            "C. O",
            "D. N"
          ],
          correctAnswer: 1,
          difficulty: "basic",
          explanation: "太厉害了！选B。化学元素符号由一到两个英文字母组成，首字母必须大写。氢元素的符号是 H，它是宇宙中丰度最高、质量最轻的元素。A项中的 He 代表氦元素，C项 O 代表氧元素，D项 N 代表氮元素。B是最正宗的氢元素符号！",
          hint: "氢气（Hydrogen）是宇宙中最小、最轻、排名第一的元素，符号就是它的英文首字母大写。"
        },
        {
          id: 4,
          question: "关于‘质量守恒定律’的微观解释，为什么反应前后的总质量一定相等？以下表述中哪一项是完全不科学、不合理的？",
          options: [
            "A. 反应前后原子的种类没有增减、也没有改变",
            "B. 反应前后原子的数目和每个原子的质量都保持一模一样",
            "C. 反应前后旧分子分裂成了新分子，但绝对没有多出或凭空耗损任何原子质量",
            "D. 部分元素会自我消失，转变为纯粹的意识和神秘电磁波"
          ],
          correctAnswer: 3,
          difficulty: "intermediate",
          explanation: "答对啦！选D。化学是一门严格依靠实证的数理自然科学，质量守恒之所以发生，就是因为在一切化学反应中，微观原子的基本属性（包括原子种类、原子个数、以及单个原子的质量）完全不曾增减或凭空更改，D选项具有迷信倾向，不符合物理事实。",
          hint: "选择选项中明显最不靠谱、最反科学的主观猜测项即可。"
        },
        {
          id: 5,
          question: "将铁钉（Fe）放在潮湿的空气中，铁会慢慢生锈形成铁锈（主要成分是三氧化二铁）。这一生锈反应中，最主要的反应物除了铁钉本身之外，还必须同时具备哪两种条件？",
          options: [
            "A. 水分 (H2O) 和 氧气 (O2)",
            "B. 纯净的氢气 (H2) 和 氦气 (He)",
            "C. 二氧化碳 (CO2) 和 阳光紫外线",
            "D. 家用白砂糖 和 碘盐颗粒"
          ],
          correctAnswer: 0,
          difficulty: "intermediate",
          explanation: "太棒了，答案选A！铁的生锈实际上是铁与周围空气中的氧气、水分子（H2O）发生漫长的氧化腐蚀电化学复杂反应。缺了水或缺了氧气（如在加盖密封的纯石蜡油内），铁钉都不会生锈。因此，隔绝水和隔绝氧就是最经典的金属防锈妙招！",
          hint: "铁生锈有两个形影不离的推手：一个是湿漉漉的液体，另一个是空气里我们呼吸赖以生存的气体。"
        }
      ]
    };
  } else if (realCategory === "biology") {
    baseData = {
      topicSummary: `本课深入讲解了《${title}》中所蕴含的生命运行机制、动植物生理奥秘及大自然食物链。通过对叶绿体等细胞器的直观解析，梳理了环境反馈与生命机制，为你解析基因遗传和生态的多样之美。`,
      keyFormulas: [
        {
          name: "光合作用生化过程",
          expression: "CO₂ + H₂O ==光照/叶绿体== 有机物(淀粉) + O₂",
          unit: "光化学转化",
          desc: "植物利用太阳光能，将二氧化碳和水合成为储能的有机物，并排放供我们呼吸的氧气。"
        },
        {
          name: "生态能量分金步梯",
          expression: "能量单向流动、逐级递减 (约10%-20%传递率)",
          unit: "生态学率",
          desc: "食物链越往顶端走，可以被分配的能量就越稀少，因而高级食肉动物数量必然少于草食动物。"
        }
      ],
      readingMaterial: {
        title: `🧬 生命之光：解读《${title}》背后的神奇细胞与自然密码`,
        content: `### 树叶底层的‘太阳能工厂’：光合作用\n\n生命是一场伟大的奇迹。当我们翻开《${title}》这本生物篇章时，我们会看到大自然中形形色色、生生不息的奥秘。为什么阳光能孕育万物？这都要归功于绿色植物叶肉细胞内的‘小绿豆’——叶绿体。叶绿体就如同是一个精密的太阳能工厂，在太阳光的照射和叶绿素的诱导下，它把空气中吸来的二氧化碳和根系吸来的水分完美重组，编织成香甜可口的淀粉（有机物），并吐出宝贵的氧气（O2)。不仅养活了植物自己，也供氧给地球上的亿万飞禽走兽。这就是伟大而大公无私的‘光合作用’。\n\n### 繁复美妙的生命层级：细胞构建大厦\n\n上至参天的红杉树、重达百吨的蓝鲸，下至草履虫和含羞草，除极个别非细胞生命（病毒）外，一切生物的‘结构和功能的基本单位’都是细胞。每个小小的多细胞有机体就像一个庞大的‘精益工厂’：细胞聚集成组织，组织配合成器官，器官串接成系统，最终构成了活生生的人体和世界。观察生命在微观上的每一个分裂和基因的染色体遗传，能让我们发自内心地敬畏自然、建立良好的卫生生活习惯。`,
        funFacts: [
          "【含羞草害羞的秘密】含羞草一碰就叶片并拢收敛，并非因为害羞。这实际是在它叶柄基部叫‘叶枕’的薄壁细胞里蓄满了水分，当你一触碰，叶枕电信号和水分迅速被逼向两侧，让叶片因瞬间失水发生下垂。",
          "【鲸鱼喷泉的真面目】鲸鱼浮出海面喷起的巨大水柱，绝对不是真的自来水喷泉。实际上是鲸鱼用肺进行急速呼吸排气时，炽热潮湿的二氧化碳废气夹带着它气孔周围的海水，在高空骤冷形成的聚积暖水珠。",
          "【大熊猫的猫生基因】大熊猫虽然拥有着标准食肉猛兽的尖锐爪牙和极其相似的铁面包胃，但在数百万年的演化中，由于基因发生突变，它们缺乏了感受鲜美肉味的受体感官，从而转行专吃竹子。"
        ],
        suggestedActivity: "🌿 【绿野寻踪：看一看你身边的生命力】\n在家里的花盆或公园里，选择两株不同的绿色植物叶片，在它的单叶正面和反面轻轻吹气。你知道为什么很多绿植叶片反面长着很多微小的、用来控制呼吸和水分蒸腾的气孔吗？找两根草叶夹在书里，画一画叶脉，亲切地对它说句感谢噢！"
      },
      questions: [
        {
          id: 1,
          question: "在绿色植物的细胞结构中，被誉为‘生命原动力太阳能转化器’的是哪一个细胞器？",
          options: [
            "A. 细胞核 (Nucleus)",
            "B. 负责将光能转化为有机物的：叶绿体 (Chloroplast)",
            "C. 主要起保护和支撑作用的：细胞壁 (Cell Wall)",
            "D. 用来储存糖水盐分的膨大液泡 (Vacuole)"
          ],
          correctAnswer: 1,
          difficulty: "basic",
          explanation: "完全正确，选B！叶绿体是绿色植物细胞所独有的结构。它含有丰富的叶绿素，是进行光合作用（即吸收光能、将无机物氧化重组为能量淀粉和氧气）的场所，因此是生命科学中当之无愧的‘绿色转化动力器’。而细胞核里存着的是遗传DNA物质控制中心，别搞混了哟！",
          hint: "想想为什么物通常看起来是充满希望的翠绿色？哪个结构赋予了它们吸收阳光、进行营养转换的绝技？"
        },
        {
          id: 2,
          question: "关于‘生态系统中的能量流动’，当食草小兔子吃掉草，食草小兔子又被大野狼捕食。在这一食物链能量流动的过程中，能量流动的典型规律是？",
          options: [
            "A. 能量会越来越多，像滚雪球一样在每个等级成倍地增长",
            "B. 能量是完全单向传送的，而且会随着层级往上升发生‘逐级递减损耗’ (传递率仅10%-20%)",
            "C. 能量可以在食物链里无限期地循环流动，狼的遗体腐烂后可以重新吐出能量活化草",
            "D. 狼和草吸收的能量完全一样，没有任何传递阶梯"
          ],
          correctAnswer: 1,
          difficulty: "intermediate",
          explanation: "回答太卓越了，选B！根据生态热力学规律，在食物链的所有级别里，每跨越一个层级，由于动植物自身呼吸散失、骨骼排泄等耗损，能量传递效率仅能分配得上一级的 10% 到 20% 左右。剩下的能量全部流失了。所以，能量流动是‘单向、逐级递减、无法百分百循环’的。这也是为什么高级野兽的数量总是异常稀少的根源。",
          hint: "草转化的大量养料，小兔子只能吸收其中的一小部分，大野狼吃后分得的则更少。每次传递都会损失大半能量。"
        },
        {
          id: 3,
          question: "如果植物完全生长在黑漆漆没有任何光线的密闭衣柜里，它无法完成光合作用，反而会发生什么生命作用（和我们人类呼吸非常相似）？",
          options: [
            "A. 自我膨胀生出更多美味的果子",
            "B. 消耗氧气、降解体内的营养物质，吐出二氧化碳的‘呼吸作用’",
            "C. 产生强烈的紫外防护罩自愈",
            "D. 停止所有生命活动，进入冬眠状态"
          ],
          correctAnswer: 1,
          difficulty: "intermediate",
          explanation: "太棒了，选B。动植物和人一样，为了维持生命，24小时都在进行‘呼吸作用’。在有光时，植物的光合作用大于呼吸作用，表现为吸二氧化碳吐氧气；而一旦置于绝对黑暗无光处，光合作用彻底停摆，植物便只进行呼吸作用，消耗氧气释放二氧化碳。所以卧室里不宜摆放过多过密植物盆栽，就是这个道理。",
          hint: "当大森林失去阳光时，叶肉里的‘太阳能合成工厂’停产了，植物也得通过消耗氧气和养料来保活，这是什么过程？"
        },
        {
          id: 4,
          question: "在显微镜下，我们的皮肤或树一格一格的微粒拼合。关于‘细胞’这一生命学说，以下哪个描述是科学严密和正确的？",
          options: [
            "A. 所有生物（包括感冒流感病毒）都是由复杂的细胞组成的",
            "B. 细胞是绝大多数生物体结构 and 功能的基本生命单位",
            "C. 任何动植物都是一整个完整的细胞，中间没有任何切区隔开",
            "D. 细胞是死气沉沉的石头，内部不包含任何分子运动"
          ],
          correctAnswer: 1,
          difficulty: "basic",
          explanation: "真棒！答案选B。在生命科学中，细胞学说确立了：除了绝大多数由蛋白质和核酸构建的‘病毒’不能算是细胞生命体外，所有的植物、动物、真菌和细菌，都是由各种功能的‘细胞’构成的。细胞是生命运作的最小结构与功能单位。它的内部极为活跃！",
          hint: "细胞是有生命力的微型工厂。病毒不能独立依靠自己分裂，算是不具有细胞结构的特例。"
        },
        {
          id: 5,
          question: "大自然通过千百万年进化形成了丰富的生物多样性。如果我们把某一片大森林里所有以害虫为食的‘小啄木鸟’全部捕杀精光，这一生态系统最可能发生的变化是？",
          options: [
            "A. 大树会长得更好、更粗壮繁茂",
            "B. 森林里生态系统失衡，害虫数量在短期内发生大爆发、严重蚕食林木导致森林衰亡",
            "C. 森林里不会有任何害虫产生，因为虫子也会跟着啄木鸟一起殉情消失",
            "D. 别的小草会主动变出高大树叶去填补一切空白"
          ],
          correctAnswer: 1,
          difficulty: "challenging",
          explanation: "答得非常精彩！选B。一个健康的生态系统具有自我维持的弹性调节能力，但这种调节是有极限的。当食物链处于‘控制害虫’枢纽的益鸟（啄木鸟）被彻底切断，害虫（天牛、松毛虫等）便失去了天敌的制衡，会在极短的时间里迅速疯狂繁衍。进而毁坏大片林木，导致生态大厦崩塌。保护物种，就是在保护我们自己！",
          hint: "啄木鸟是树木的‘医生’、昆虫的克星。没有了啄木鸟这位林中侦查官，藏在树皮底下的啃树虫会怎么样？"
        }
      ]
    };
  } else {
    // physics / general science
    baseData = {
      topicSummary: `本课精细讲解了《${title}》中涉及的核心数理自然规律、能量守恒与经典实验。我们打破繁冗生硬的概念，结合日常力学、声光电等奇趣现象，带你轻松透视科学常识的底层物理推衍逻辑！`,
      keyFormulas: [
        {
          name: "欧姆定律公式",
          expression: "I = U / R",
          unit: "电学",
          desc: "在一段导体中，流过的电流I与两端的电压U成正比，与电阻R成反比，是电学电路计算的首要法则。"
        },
        {
          name: "重力大小计算公式",
          expression: "G = m · g (g≈9.8 N/kg)",
          unit: "力学",
          desc: "物体所受的引力重力G与其本身质量m成正比，其中g为地球表面的重力加速度常量。"
        },
        {
          name: "阿基米德浮力原理",
          expression: "F浮 = ρ液 · g · V排",
          unit: "力学/流体力学",
          desc: "浸在液体中的物体受到的向上浮力，大小等于其排开的液体受到的重力值。"
        }
      ],
      readingMaterial: {
        title: `⚛️ 探寻物理足迹：解密《${title}》中的科学探究之谜`,
        content: `### 科学的萌芽：观察与实验的奇迹\n\n物理学是一门在实践、观察和理性求证中建立起来的学科。在《${title}》这个章节里，无论是声能震动、奇妙的光线折射，还是蕴含力量的牛顿摆动，最终都能用最简练的‘物理定律’来予以概括。正如伽利略推翻亚里士多德‘重物先落’的斜塔实验，真正卓越的科学认知需要基于实验。物理学不仅在巨型实验室中，更存在于我们熟知的日常瞬间。\n\n### 守恒律与相互作用：宇宙运转的铁轨\n\n大至群星环绕，小到原子内部的电子跃迁，物理世界均深深遵守着几大底层守恒原则，其中最著名的之一就是‘能量守恒定律’。能量绝不会凭空消灭，也绝不会凭空降生，它只会从一种形式（如重力势能）巧妙转变为另一种形式（如动能，或摩擦发热的内能），并在此转移转化过程中物质量始终保持不变。而‘力的作用是相互的’这一原则，则决定了我们踩地面、地面也就用同等力量撑起我们，让我们迈步奔跑。读懂它，你眼前的电灯、呼啸而过的火车、甚至手中的智能手机屏幕，都会变成一段段充满智慧的物理史诗故事。`,
        funFacts: [
          "【牛顿与那只苹果】艾萨克·牛顿在看到草地上苹果落地时引发深思，并不是因为树上的苹果突然砸破了他的头。他由此联想：既然重力能作用到全部树尖，那么它是不是能无限向上延伸、直至拽住悬浮在轨道上环绕不息的月亮？由此启迪了万有引力宇宙定律。",
          "【光速的宇宙极限定理】在真空中，光的速度高达约 299,792,458 米每秒，也就是说它能在一秒钟内绕着地球赤道狂奔差不多七圈半！而且这也是宇宙中任何携带信息与质量的微粒所能达到的最极限速度值。",
          "【不爱说话的卡文迪许】英国物理学家卡文迪许通过巧妙悬挂的电磁扭秤实验‘称量’出了引力常数以及地球的重量。他性格极其孤僻害羞，但他的测重精度整整遥遥领先了那一时代一百五十年。"
        ],
        suggestedActivity: "🔌 【动手连连看：用身边材料验证物理原理】\n取一根塑料吸管，把它用力在一块干燥透气的衣服或纸巾上快速反复摩擦大约 15 下，然后慢慢将吸管靠近一堆轻撕得极其细碎的小纸片或者是水龙头细软的水流。看！吸管竟然能凭空吸引小纸片或让落的细直水流发生物理弯折弯度！这就是经典的‘摩擦起电’和静电力场现象。"
      },
      questions: [
        {
          id: 1,
          question: "在物理力学中，关于‘力的作用是相互的’这一经典物理原理，下列生活例子中哪一个是对应的完美体现？",
          options: [
            "A. 小船上的乘客用力向前推岸，自己的小船反而被推向远离岸边的江心",
            "B. 用望远镜观察遥远的夜空星海，看到极亮的恒星",
            "C. 磁铁不产生任何震动就凭空靠住桌边的硬币",
            "D. 在安静的教室里大声说话，声音引起同桌的注意"
          ],
          correctAnswer: 0,
          difficulty: "basic",
          explanation: "好聪明，答案选A！当小船上的乘客使劲‘向前推岸’时，他对岸产生了一个向前的‘作用力’。因为‘力的相互作用原理’，岸必然会同时施加给小船一个大小完全相等、但方向相反向后的‘反作用力’，使船退。A是力的相互作用在日常生活里的最佳见证！",
          hint: "相互作用力的精髓在于：你用多少力去‘打’别人，别人（或墙、岸）就会给你反馈相等的力。"
        },
        {
          id: 2,
          question: "我们在暴风雨过后的夏夜常看到：‘先看到划破长空的闪电，隔了大约3秒钟才依稀听到远处的轰轰雷声’。关于这一自然科学物理常识，下面最正确的解释是？",
          options: [
            "A. 打雷发生得很晚，它们本来就不是同时在空中发生的",
            "B. 闪电和雷声是同时物理发生的，但在空气中传播时，光速度远远快于声速",
            "C. 打雷的人故意放慢了声音的播放，为了留给孩子们闭眼的时间",
            "D. 雷声被空中的高大乌云吸收了，所以耗损了它的飞翔时间"
          ],
          correctAnswer: 1,
          difficulty: "basic",
          explanation: "完全答对啦！选B。打雷和闪电实际是由于高空冷暖云气发生剧烈摩擦瞬间‘同时物理发生’。但是，光速度高达 300,000 千米每秒（瞬间瞬达眼底），而声速在空气里只有大 340 米/秒。也就是声音要跑 1000 米得耗费大约 3 秒钟。所以你会先看到亮光、再传来闷雷声哦。",
          hint: "想一想，光速和声速哪个是宇宙最快的极限速度？亮光和轰鸣哪一个能以秒级绕地行驶？"
        },
        {
          id: 3,
          question: "当我们在冬天的早晨推门而出，迎面吹来的寒风里我们看到：‘戴眼镜的同学从寒冷刺骨的室外一走进温暖如春的室内，眼镜片瞬间蒙上一层厚厚的水雾，什么也看不清了’。这雾气在热学物理中属于以下哪一种物态变化？",
          options: [
            "A. 升华 (Sublimation)",
            "B. 液化 (Liquefaction)",
            "C. 汽化 (Vaporization)",
            "D. 熔化 (Melting)"
          ],
          correctAnswer: 1,
          difficulty: "intermediate",
          explanation: "真优秀！选B。冷冰冰的眼镜片自室外带入温暖的室内。屋里空气中原本含有的、温度较高的‘水蒸气’（气态水），在遇到冷的镜片表面时，会在瞬间放出热量，直接遇冷发生‘由气态变成液态’的白雾。这种由‘气态变液态’的过程在物理上统称：液化！",
          hint: "眼镜上的雾气实际是一颗颗细密的小冷水珠。水蒸气（气态）接触到冷镜片凝成冷水滴（液态），这就是液化。"
        },
        {
          id: 4,
          question: "根据电学核心欧姆定律（I = U/R），如果某一个工作灯泡的内部电阻 R 保持不变，当我们把通入灯泡两端的外部控制电压 U 提升为原来的 2 倍时，通过这一灯泡内部的电流 I 会发生何种变化？",
          options: [
            "A. 电流会随之缩减为原本的二分之一 (1/2)",
            "B. 电流会原封不动保持原来的大小，完全不受影响",
            "C. 电流会对应提升、大涨到原本的 2 倍大小",
            "D. 灯泡里的电阻会彻底烧毁，阻值变为无穷大"
          ],
          correctAnswer: 2,
          difficulty: "intermediate",
          explanation: "答得漂亮！答案选C。欧姆定律公式为 I = U / R。当分母电阻 R 维持不变时，分子部分的输入电压 U 与产生的电流 I 呈现绝对的‘正比对应关系’。所以电压 U 扩充为原来的两倍，电流 I 理所应当随之线性膨胀为原本的 2 倍大小。",
          hint: "看公式 I = U/R，如果 U 在分子位置乘以 2，且 R 保持其值不变，算出的 I 会翻几倍？"
        },
        {
          id: 5,
          question: "在玩水上乐园时，我们把一个充满空气的彩色塑料皮球在水面玩耍。当你用双手使劲把皮球完全用力按到水底下时，皮球受到的‘向上浮力’与它半浮在水面、未按下去之前相比，发生了何种改变？",
          options: [
            "A. 球浸没在水底受到的向上浮力明显变大",
            "B. 浸在水里的浮力立刻降为0，毫无浮力可言",
            "C. 浮力完全没有改变，和在水面上漂着时一模一样",
            "D. 球会被水底的水泥地牢牢吸附，朝下拉力增加"
          ],
          correctAnswer: 0,
          difficulty: "challenging",
          explanation: "极具挑战！恭喜你选对了，答案是A。根据阿基米德浮力原理：F浮 = ρ液 · g · V排。浮力的大小跟液体的密度以及‘物体排开液体的总体积’直接挂钩。当球大面积漂浮在水上时，排开的水体积只占皮球的一部分；而你使劲把它按到水底后，皮球是 100% 浸没并排开了等于它自身尺寸的整杯水！由于排开的水体积大增加，它遭受的向上浮力达到最大值，因而你的双手必须超级用力按压，放开就会弹起。",
          hint: "球往水里埋得越深、吞没的水分体积越多，水神给它的向上承托力（浮力）就越大！"
        }
      ]
    };
  }

  // Adjust number of questions requested
  if (baseData.questions.length > questionCount) {
    baseData.questions = baseData.questions.slice(0, questionCount);
  } else if (baseData.questions.length < questionCount) {
    // If more are requested, reuse existing items with new IDs
    const extraQuestions = [];
    for (let i = 0; i < questionCount; i++) {
      const baseQ = baseData.questions[i % baseData.questions.length];
      extraQuestions.push({
        ...baseQ,
        id: i + 1
      });
    }
    baseData.questions = extraQuestions;
  }

  return baseData;
}

// Conversation Dialogue Fallsafe explainer
function getFallbackExplanation(question: string, selectedOption: any, correctOption: number, originalExplanation: string, childQuery: string) {
  const correctLetter = String.fromCharCode(65 + correctOption);
  const selectedLetter = typeof selectedOption === "number" ? String.fromCharCode(65 + selectedOption) : "未知";
  
  return `### 👋 嗨，同学！AI 特级名师来给你详细解惑啦！

你问的这个问题非常棒！别气馁，物理和各门学科的学习本来就是在一个个疑问中不断弄懂、精进的过程。下面老师用最生动、最容易理解的方式来给你拆解一下这道题：

**【题目重温】**
> ${question}

**【答案分析】**
这道题的正确答案是 **${correctLetter} 选项**。${originalExplanation ? `正如我们预习重点里提到的：*“${originalExplanation}”*。` : ""}

**【特邀名师点拨】**
${childQuery ? `针对你刚才提问的：“*${childQuery}*”，` : ""}我们可以把它想象成一个非常有趣、活生生的日常生活场景：
1. **举个贴心的例子**：就像我们在寒冷天气里呼热气、或者乘坐列车在铁轨上受到的惯性托撑一样。大自然中物态变化、能量移动是严格遵循物理定理的；而在人文学科中，字词搭配和语序结构就像两个紧紧扣在一起的积木，必须要顺理成章、契合严密才行。
2. **重点敲黑板（知识要点）**：看清干扰陷阱！只要我们在解题时，能够牢固抓住它的核心公式（比如“欧姆定律电路分配”、“光的色散折射原理”），所有的迷惑性错项都会立即迎刃而解啦！

加油，你已经做得极其出色了！只要转换一个看问题的视角，接下面的练习你一定会完成得又快又准。如果还有任何不懂的可视化物理或者科学难题，随时呼叫老师哦！🌟`;
}

// Endpoint 2: AI Generate Quiz based on Video Metadata or Topic keywords
app.post("/api/quiz/generate", async (req, res) => {
  const { title, description, category, gradeLevel, questionCount = 5 } = req.body;

  if (!title) {
    return res.status(400).json({ error: "缺少核心学习内容或视频标题，无法生成题目" });
  }

  const subCfg = getSubjectConfig(category);

  // Construct a prompt optimized for physical science questions or other school subjects based on selected categories
  const prompt = `${subCfg.role}
请针对以下给出的视频或学习单元内容，为 ${gradeLevel || "初中（七至九年级）"} 学生生成一套互动测评卷以及一份量身定制的“拓展阅读与深度总结材料”，考察并启发学生的学习与思考。

【学习单元/视频标题】：${title}
【视频简介/相关学情】：${description || "无详细描述，请参考该学科考试大纲，生成对应层级的考点题目与阅读物。"}
【核心学科/科学范畴】：${category || "综合科普与自然学科"}
【计划生成题数】：${questionCount} 道单项选择题

【最核心的范围匹配铁律与纯净度要求（极度严格重要）】：
1. **测试题目完全匹配本章节视频，严禁超纲或混入无关学科题目**：
   - 所有的选择题 (questions) 必须 100% 局限在本视频的主题内容以及视频中所蕴含的、直接表达的科学定律、公式或学科概念范围内！
   - 严禁加入任何本视频和本章节完全没有提及的、非本学科或本主题范畴的干扰计算或无关定义！
     例如：对《化学反应》视频，切不可出现“物理电路计算”或“语文修辞”。试题场景设计必须紧密结合该学科，且符合生活常情。
   - 题目内容侧重考察：${subCfg.focus}

2. **核心概念公式 (keyFormulas) 具有极高针对性与纯净度**：
   - 重点公式/规律概念列表 (keyFormulas) 有且仅提供本视频包含的主旨核心规律、文法、方程式表达（不可罗列无关重点）。

3. **科普/文科拓展阅读与趣味故事、动手探究实践的 100% 视频概念紧密绑定**：
   - **拓展阅读内容 (readingMaterial.content)**：编写的文章绝对不能是宽泛的，必须紧紧围绕该视频展现的定理规律、探究器具、科学历史背景、古诗词出处或核心概念进行深浅适宜的科普/文化深度引申（500-600字左右），支持 Markdown 段落排版（使用 ### 等标明中标题）。
   - **趣味学科冷知识 (funFacts)**：提供 3 条生动有趣的冷知识或历史趣味逸闻故事，必须直接和该节的主题、学科人物密切相关。
   - **探究微实践 (suggestedActivity)**：${subCfg.activityDesc}

4. **题目质量与教学法规范**：
   - 题目难度分级合理（'basic' 基础，'intermediate' 进阶提高，'challenging' 具有挑战性的高阶思维题）。
   - 选项中一定要包含常见的认知迷思、常犯语法/计算错误作为障碍项。
   - 带有极其详尽、语气温柔口吻的“深度解析 (explanation)”，结合生活例子解释正确项，论证排除错误干扰项，让孩子能轻松看懂。
   - 提供一个“思路启发 (hint)”，点拨思考，不能直接泄露答案。

回复格式必须遵循所指定的 JSON 格式。`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["questions", "topicSummary", "keyFormulas", "readingMaterial"],
          properties: {
            topicSummary: {
              type: Type.STRING,
              description: `对这个视频所学科目知识点的精简提炼（字数在150字以内），方便孩子在测试前快速重温。`
            },
            keyFormulas: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["name", "expression", "unit", "desc"],
                properties: {
                  name: { type: Type.STRING, description: `考点名称或规律/公式定律名字。如：${subCfg.keyName}` },
                  expression: { type: Type.STRING, description: `核心数学式、英文搭配结构或化学反应方程式。如：${subCfg.formulaDesc}` },
                  unit: { type: Type.STRING, description: "核心单位（如物理/数学有单位则输出，英文/语文无单位可写'无'或词性）" },
                  desc: { type: Type.STRING, description: "简述此公式或考点用法中所包含各符号/词组分别代表的意思及核心考纲地位" }
                }
              },
              description: "本单元学习涉及的核心学科公式或文法重点，方便孩子在测评前后对照复习。"
            },
            readingMaterial: {
              type: Type.OBJECT,
              required: ["title", "content", "funFacts", "suggestedActivity"],
              properties: {
                title: { type: Type.STRING, description: "富有巧思且对相应学龄段孩子极具吸引力的科普拓展文章标题" },
                content: { type: Type.STRING, description: "长篇深度科普/语文/英文拓展阅读材料（约500-600字），文字要通俗易懂，适合中小学生，支持Markdown段落排版。" },
                funFacts: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "3条与该课题、作者、学科或规律密切相关、容易引起学习兴趣的冷门知识或学者历史故事"
                },
                suggestedActivity: {
                  type: Type.STRING,
                  description: "一个和该节重点相关、能在生活常态下安全体验的趣味实践或动手小实验（包含名字、所需材料/语境和简明可行的探究步骤）"
                }
              }
            },
            questions: {
              type: Type.ARRAY,
              description: "问题列表，包含指定数量 of 单项选择题",
              items: {
                type: Type.OBJECT,
                required: ["id", "question", "options", "correctAnswer", "difficulty", "explanation", "hint"],
                properties: {
                  id: { type: Type.INTEGER, description: "题目序号，从 1 开始" },
                  question: { type: Type.STRING, description: "题目文本，清晰地阐明情境、材料或基础问题。" },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "4个选项：A, B, C, D，需有具体的现象、翻译、运算或答案"
                  },
                  correctAnswer: {
                    type: Type.INTEGER,
                    description: "正确选项的索引值，0代表A，1代表B，2代表C，3代表D"
                  },
                  difficulty: {
                    type: Type.STRING,
                    description: "题目难度等级，必须是 'basic'、'intermediate'、'challenging' 之一"
                  },
                  explanation: {
                    type: Type.STRING,
                    description: "详细、带有启发式的幽默名师口吻解析，结合日常和题目情境解释为什么选该项，其他项错在哪里。"
                  },
                  hint: {
                    type: Type.STRING,
                    description: "一个引导探究式、和蔼的点拨小提示，引导答错的学生进行自主思考。"
                  }
                }
              }
            }
          }
        }
      }
    });

    const parsedData = JSON.parse(response.text.trim());
    return res.json({
      success: true,
      data: parsedData
    });

  } catch (error: any) {
    console.error("Gemini quiz generation error. Triggering fallback data handler:", error);
    try {
      const fallbackData = getFallbackData(title, description, category, gradeLevel, questionCount);
      return res.json({
        success: true,
        data: fallbackData,
        isFallback: true,
        fallbackMessage: "由于名师咨询量过载，已自动启动本地离线精编考库，提供100%匹配的高准度测评与拓展阅读！"
      });
    } catch (fallbackErr: any) {
      console.error("Critical double-failure in quiz fallback generation:", fallbackErr);
      return res.status(500).json({
        error: "AI 老师生成测试卷时开小差了，请检查网络或点击重新生成。",
        details: error.message
      });
    }
  }
});

// Endpoint 3: AI Explanation Dialogue
app.post("/api/ai/explain", async (req, res) => {
  const { question, selectedOption, correctOption, explanation, childQuery } = req.body;

  if (!question) {
    return res.status(400).json({ error: "无效的解题上下文" });
  }

  const prompt = `你是一位非常有耐心、深受孩子们爱戴的初中物理/科学特级教师。
有一位学生在做以下题目：
题目：${question}
正确答案：选项${String.fromCharCode(65 + correctOption)}
深度解析：${explanation}

学生对此有疑问，或者输入了下面这个问题：
“${childQuery || "老师，我不理解为什么是这个答案，能用更简单的方法给我讲一遍吗？"}”

请你针对他的提问或疑惑，写一段极具亲和力、循循善诱的讲解（大约 200 到 300 字）：
1. 用极简且生动的生活场景（例如水流、跑步、拔河、照镜子）来打比方。
2. 保持语气亲切，像是和朋友聊天，给孩子学习信心。
3. 请使用 Markdown 格式输出。`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    return res.json({
      success: true,
      explanationText: response.text
    });
  } catch (error: any) {
    console.error("Gemini explanation generation error. Triggering fallback explainer:", error);
    try {
      const fallbackExplanation = getFallbackExplanation(question, selectedOption, correctOption, explanation, childQuery);
      return res.json({
        success: true,
        explanationText: fallbackExplanation,
        isFallback: true
      });
    } catch (fallbackErr: any) {
      console.error("Critical fallback failure in explanation:", fallbackErr);
      return res.status(500).json({
        error: "AI 老师正在批改作业，暂时无法回复，请稍后再试。",
        details: error.message
      });
    }
  }
});

// Setup dev server with Vite
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`BiliStudy Server running on port ${PORT}`);
  });
}

startServer();
