import { useState, FormEvent } from "react";
import { 
  Plus, 
  Trash2, 
  TrendingUp, 
  Award, 
  Clock, 
  BarChart2, 
  Youtube, 
  Sparkles, 
  Search, 
  BookOpen, 
  ChevronDown, 
  CheckCircle, 
  AlertCircle,
  Clock3,
  ListRestart,
  Heart,
  Compass
} from "lucide-react";
import { BiliVideo, StudyRecord, Medal } from "../types";

interface ParentDashboardProps {
  videos: BiliVideo[];
  records: StudyRecord[];
  medals: Medal[];
  onAddVideo: (video: BiliVideo) => void;
  onDeleteVideo: (id: string) => void;
  onClearHistory: () => void;
}

export default function ParentDashboard({ 
  videos, 
  records, 
  medals, 
  onAddVideo, 
  onDeleteVideo,
  onClearHistory
}: ParentDashboardProps) {
  // Video link addition inputs
  const [biliUrl, setBiliUrl] = useState("");
  const [retrievedVideo, setRetrievedVideo] = useState<any | null>(null);
  const [fetchingInfo, setFetchingInfo] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState("初中二年级");
  const [selectedCategory, setSelectedCategory] = useState<string>("physics");
  const [guessedCategory, setGuessedCategory] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState(5);
  const [loadStage, setLoadStage] = useState(0);

  // Helper to guess category based on title & description
  const guessCategory = (title: string, desc: string): string => {
    const text = `${title} ${desc}`.toLowerCase();
    if (/语文|古诗|文言文|成语|修辞|现代文|拼音|汉字|拼写|生字词|阅读理解|中考语文|高考语文|散文|鲁迅|李白|杜甫/i.test(text)) {
      return "chinese";
    }
    if (/英语|单词|语法|口语|听力|时态|动词|名词|形容词|代词|完形填空|english|vocabulary|grammar/i.test(text)) {
      return "english";
    }
    if (/数学|几何|代数|勾股定理|方程|函数|乘除|比例|概率|统计|奥数|对称|微积分|等差数列|二次函数|中考数学/i.test(text)) {
      return "math";
    }
    if (/化学|酸碱|元素周期表|方程式|溶解度|溶质|催化剂|反应|金属|有机化学|分子|原子|中考化学|实验室/i.test(text)) {
      return "chemistry";
    }
    if (/生物|细胞|光合作用|呼吸作用|生态|染色体|遗传|基因|进化|叶绿体|动物|植物|微生物/i.test(text)) {
      return "biology";
    }
    if (/力学|重力|压力|浮力|压强|摩擦力|杠杆|速度|牛顿|惯性|摩擦力|阿基米德/i.test(text)) {
      return "mechanics";
    }
    if (/光学|折射|反射|全反射|凸透镜|透镜|小孔成像|光速|折射率/i.test(text)) {
      return "optics";
    }
    if (/声学|次声|超声|声音|音调|音频|响度|音色|鸣叫|分贝|振动|噪音/i.test(text)) {
      return "acoustics";
    }
    if (/热学|温度|液体|液化|汽化|升华|冰|热量|比热容|熔化|凝固/i.test(text)) {
      return "thermal";
    }
    if (/电磁|电路|电压|电流|电阻|欧姆|并联|串联|磁场|电功率|安培/i.test(text)) {
      return "electromagnetics";
    }
    if (/物理|初中物理|中考物理|牛顿定律|科学实验/i.test(text)) {
      return "physics";
    }
    return "other";
  };

  const getCategoryName = (cat: string) => {
    switch (cat) {
      case "chinese": return "语文 📚";
      case "math": return "数学 📐";
      case "english": return "英语 🔠";
      case "physics": return "物理 ⚛️";
      case "chemistry": return "化学 🧪";
      case "biology": return "生物 🧬";
      case "mechanics": return "【经典物理】力学 ⛵";
      case "optics": return "【经典物理】光学 🌈";
      case "acoustics": return "【经典物理】声学 📣";
      case "thermal": return "【经典物理】热学 🔥";
      case "electromagnetics": return "【经典物理】电磁学 ⚡";
      default: return "综合科普 🧭";
    }
  };

  // Custom Toast notification states
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => prev?.message === message ? null : prev);
    }, 5000);
  };

  // Expanded items in history report
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  // Calculate diagnostic aggregated details
  const totalTests = records.length;
  const unlockedMedalCount = medals.filter(m => m.unlockedAt).length;
  
  const averageAccuracy = totalTests > 0 
    ? Math.round(records.reduce((acc, curr) => acc + (curr.correctCount / curr.totalQuestions), 0) / totalTests * 100)
    : 0;

  const totalMinutes = Math.round(videos.reduce((sum, v) => sum + (v.duration || 0), 0) / 60) + (totalTests * 10); // Simulated time

  // Sub-category analysis (number of completed test scores in each branch)
  const categoryStats: { [key: string]: { name: string; count: number; sum: number } } = {
    chinese: { name: "语文 (Chinese)", count: 0, sum: 0 },
    math: { name: "数学 (Math)", count: 0, sum: 0 },
    english: { name: "英语 (English)", count: 0, sum: 0 },
    physics: { name: "物理 (Physics)", count: 0, sum: 0 },
    chemistry: { name: "化学 (Chemistry)", count: 0, sum: 0 },
    biology: { name: "生物 (Biology)", count: 0, sum: 0 },
    other: { name: "综合科普 (Other Subjects)", count: 0, sum: 0 },
    mechanics: { name: "力学 (Mechanics)", count: 0, sum: 0 },
    optics: { name: "光学 (Optics)", count: 0, sum: 0 },
    acoustics: { name: "声学 (Acoustics)", count: 0, sum: 0 },
    thermal: { name: "热学 (Thermal)", count: 0, sum: 0 },
    electromagnetics: { name: "电磁学 (Electromagnetics)", count: 0, sum: 0 }
  };

  records.forEach(rec => {
    const parentVideo = videos.find(v => v.id === rec.videoId);
    if (parentVideo) {
      const cat = parentVideo.category;
      if (categoryStats[cat]) {
        categoryStats[cat].count++;
        categoryStats[cat].sum += rec.score;
      }
    }
  });

  // Action: validate Bilibili url and pull attributes from Bilibili API
  const handleValidateUrl = async (e: FormEvent) => {
    e.preventDefault();
    if (!biliUrl.trim()) return;

    setFetchingInfo(true);
    setRetrievedVideo(null);
    setGuessedCategory(null);

    const cleanBiliUrlClient = (text: string) => {
      if (!text) return "";
      // Match b23.tv URL (with or without protocol)
      const b23Regex = /(https?:\/\/b23\.tv\/[a-zA-Z0-9]+)/i;
      const b23Match = text.match(b23Regex);
      if (b23Match) return b23Match[1];

      const b23NoProtoRegex = /(b23\.tv\/[a-zA-Z0-9]+)/i;
      const b23NoProtoMatch = text.match(b23NoProtoRegex);
      if (b23NoProtoMatch) return "https://" + b23NoProtoMatch[1];

      // Match standard bilibili.com URL
      const standardRegex = /(https?:\/\/(?:www\.)?bilibili\.com\/video\/[a-zA-Z0-9\-_?=]+)/i;
      const standardMatch = text.match(standardRegex);
      if (standardMatch) return standardMatch[1];

      // Match any URL in text
      const httpRegex = /(https?:\/\/[^\s]+)/i;
      const httpMatch = text.match(httpRegex);
      if (httpMatch) return httpMatch[1];

      return text.trim();
    };

    const extractBilibiliIdClient = (url: string) => {
      if (!url) return null;
      const bvRegex = /(BV[a-zA-Z0-9]{10})/i;
      const avRegex = /(av[0-9]+)/i;
      const bvMatch = url.match(bvRegex);
      if (bvMatch) return { type: "bvid", id: bvMatch[1] };
      const avMatch = url.match(avRegex);
      if (avMatch) return { type: "aid", id: avMatch[1].replace(/av/i, "") };
      return null;
    };

    const cleanedUrl = cleanBiliUrlClient(biliUrl);
    console.log("Client-side cleaned content url to:", cleanedUrl);

    try {
      const response = await fetch(`/api/bilibili/info?url=${encodeURIComponent(cleanedUrl)}`);
      if (!response.ok) {
        throw new Error("HTTP status " + response.status);
      }
      const data = await response.json();
      if (data.bvid || data.success) {
        setRetrievedVideo(data);
        const guessed = guessCategory(data.title || "", data.description || "");
        setSelectedCategory(guessed || "physics");
        setGuessedCategory(guessed || "physics");
        if (data.isFallback) {
          showToast("⚠️ 已自适应切换为本地安全网关配置！您可在此编辑名字、BV号与考察大纲并开始出卷！", "info");
        } else {
          showToast("成功获取视频并且已智能判断对应学科学术归属，请检查和构建AI评测！", "success");
        }
      } else {
        throw new Error(data.error || "获取视频资料失败");
      }
    } catch (err: any) {
      console.error("Fetch Bilibili info failed, running local parser fallback:", err);
      const idInfo = extractBilibiliIdClient(cleanedUrl) || extractBilibiliIdClient(biliUrl);
      
      const isShortUrl = /b23\.tv/i.test(biliUrl);
      const finalBvid = idInfo && idInfo.type === "bvid" ? idInfo.id : "BV17J411g7v5"; // Fallback to classic physics vid
      const finalAid = idInfo && idInfo.type === "aid" ? idInfo.id : null;

      const fallbackData = {
        success: true,
        bvid: finalBvid,
        aid: finalAid,
        title: idInfo ? `B站自定视频单元 (${idInfo.id})` : `B站自定学习视频`,
        description: "已自适应开启备课模型。您可直接在下方对视频名称、考查重点大纲或视频 BV 号进行快速编辑与一键智能出题！",
        pic: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop",
        duration: 360,
        owner: "B站自备视频",
        isFallback: true,
        pages: []
      };

      setRetrievedVideo(fallbackData);
      const guessed = guessCategory(cleanedUrl || biliUrl, "");
      setSelectedCategory(guessed || "physics");
      setGuessedCategory(guessed || "physics");

      showToast("⚠️ 已自适应切换到本地安全配置。您可在此直接定义你要考察的主题和 BV 号并一键做卷！", "info");
    } finally {
      setFetchingInfo(false);
    }
  };

  // Action: request AI to trigger content matching generator quiz
  const handleGenerateQuiz = async () => {
    if (!retrievedVideo) return;
    setGeneratingQuiz(true);
    setLoadStage(0);

    // Simulate friendly stages of physics parsing animation steps which keeps parents fully updated and amused!
    const interval = setInterval(() => {
      setLoadStage(prev => {
        if (prev < 3) return prev + 1;
        return prev;
      });
    }, 2800);

    try {
      const hasParts = retrievedVideo.pages && retrievedVideo.pages.length > 1;
      const targetTitle = hasParts && retrievedVideo.pages[0].part
        ? `${retrievedVideo.title}（第一集：${retrievedVideo.pages[0].part}）`
        : retrievedVideo.title;

      const response = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: targetTitle,
          description: retrievedVideo.description,
          category: selectedCategory,
          gradeLevel: selectedGrade,
          questionCount: questionCount
        })
      });

      const resJson = await response.json();
      if (resJson.success && resJson.data) {
        const generatedQuiz = resJson.data;

        // Populate parts list if multi-part series
        const videoParts = hasParts
          ? retrievedVideo.pages.map((p: any) => ({
              page: p.page,
              title: p.part || `第 ${p.page} 集`,
              duration: p.duration,
              quizGenerated: p.page === 1,
              quizData: p.page === 1 ? generatedQuiz : undefined,
              readingMaterial: p.page === 1 ? generatedQuiz.readingMaterial : undefined
            }))
          : undefined;

        // Assembly full video structure
        const newVideo: BiliVideo = {
          id: Date.now().toString(),
          title: retrievedVideo.title,
          description: retrievedVideo.description,
          pic: retrievedVideo.pic || "https://images.unsplash.com/photo-1517462964-21fdcec3f25b?w=600&auto=format&fit=crop",
          duration: retrievedVideo.duration || 300,
          owner: retrievedVideo.owner || "Bilibili 学堂",
          category: selectedCategory,
          bvid: retrievedVideo.bvid,
          videoUrl: `https://www.bilibili.com/video/${retrievedVideo.bvid}`,
          gradeLevel: selectedGrade,
          addedAt: new Date().toISOString(),
          quizGenerated: true,
          quizData: generatedQuiz,
          readingMaterial: generatedQuiz.readingMaterial,
          parts: videoParts
        };

        onAddVideo(newVideo);
        // Clear forms
        setBiliUrl("");
        setRetrievedVideo(null);
        showToast(
          hasParts 
            ? `🎉 学习大纲《${retrievedVideo.title}》已成功导入为合集视频！第一集测评和阅读材料已就绪。`
            : `🎉 学习单元《${retrievedVideo.title}》已成功搭建AI评测！`, 
          "success"
        );
      } else {
        showToast(resJson.error || "AI生成题目时出现了小问题，请重试！", "error");
      }
    } catch (err: any) {
      console.error(err);
      showToast("连接超时。请检查AI接口配额，或稍后点击重试。", "error");
    } finally {
      clearInterval(interval);
      setGeneratingQuiz(false);
      setLoadStage(0);
    }
  };

  const getLoadingStageText = () => {
    switch (loadStage) {
      case 0: return "✨ AI 正在拆解 Bilibili 教学视频核心内容与文本结构...";
      case 1: return "🧭 AI 特级教师正在匹配对应学科考试大纲与精髓词目...";
      case 2: return "💡 正在定制生成高启发性、结合生活情景的选择题...";
      case 3: return "🏆 正在为题目匹配详细的教师幽默解析与探究提示...";
      default: return "⚡ 即将大功告成...";
    }
  };

  const getCategoryTheme = (cat: string) => {
    switch (cat) {
      case "chinese": return { name: "语文", color: "bg-red-500/20 text-red-300 border border-red-500/25" };
      case "math": return { name: "数学", color: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/25" };
      case "english": return { name: "英语", color: "bg-pink-500/20 text-pink-300 border border-pink-500/25" };
      case "physics": return { name: "物理", color: "bg-blue-500/20 text-blue-300 border border-blue-500/25" };
      case "chemistry": return { name: "化学", color: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/25" };
      case "biology": return { name: "生物", color: "bg-indigo-500/20 text-indigo-300 border border-indigo-500/25" };
      case "mechanics": return { name: "力学", color: "bg-blue-500/20 text-blue-300 border border-blue-500/25" };
      case "optics": return { name: "光学", color: "bg-amber-500/20 text-amber-300 border border-amber-500/25" };
      case "acoustics": return { name: "声学", color: "bg-teal-500/20 text-teal-300 border border-teal-500/25" };
      case "thermal": return { name: "热学", color: "bg-orange-500/20 text-orange-300 border border-orange-500/25" };
      case "electromagnetics": return { name: "电磁学", color: "bg-purple-500/20 text-purple-300 border border-purple-500/25" };
      default: return { name: "综合科普", color: "bg-slate-500/20 text-slate-300 border border-slate-500/25" };
    }
  };

  return (
    <div className="space-y-8">
      {/* Toast notifications */}
      {toast && (
        <div className="fixed top-20 right-4 z-[100] animate-fade-in max-w-sm bg-slate-900 border border-white/10 p-4 rounded-2xl shadow-2xl flex items-center gap-3">
          <div className={`p-1.5 rounded-lg shrink-0 ${
            toast.type === "success" 
              ? "bg-emerald-500/20 text-emerald-450" 
              : toast.type === "error" 
              ? "bg-rose-500/20 text-rose-455" 
              : "bg-blue-500/20 text-blue-450"
          }`}>
            {toast.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          </div>
          <div className="text-xs font-semibold text-slate-200 leading-normal">{toast.message}</div>
          <button onClick={() => setToast(null)} className="text-sm text-slate-400 hover:text-white ml-auto font-mono cursor-pointer p-1">&times;</button>
        </div>
      )}
      
      {/* SECTION 1: Diagnostic Aggregation Header */}
      <div className="bg-white/5 backdrop-blur-md text-white rounded-3xl p-6 border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Decorative background grid elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 opacity-10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500 opacity-10 blur-[100px] pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-xs font-semibold text-blue-400 tracking-wider uppercase block">
              💡 家长智能督学后台 (Parent Diagnostics Dashboard)
            </span>
            <h1 className="text-2xl font-bold tracking-tight mt-1 text-white font-sans">
              全科诊断・孩子星级学情成长报告
            </h1>
            <p className="text-xs text-slate-350 mt-1.5 leading-relaxed">
              实时监测孩子的错题重点、平均正确率与思维成长。点击下方表单可一键拉取热门B站视频，并定制中考难度的科学评测题目。
            </p>
          </div>

          <div className="flex gap-2.5 shrink-0 self-start md:self-center">
            <span className="px-3.5 py-1.5 bg-blue-500/15 border border-blue-400/20 text-blue-300 rounded-xl text-xs font-bold flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 fill-blue-300 animate-pulse" />
              高效辅导・学业有成
            </span>
          </div>
        </div>

        {/* Aggregate Stats Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/5 flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 text-blue-300 rounded-lg shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">平均评测正确率</span>
              <span className="text-xl font-mono font-black text-white">{averageAccuracy}%</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/5 flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-300 rounded-lg shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">已完成测试次数</span>
              <span className="text-xl font-mono font-black text-white">{totalTests} <span className="text-xs font-sans font-normal text-slate-400">次</span></span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/5 flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-300 rounded-lg shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">解锁勋章大奖</span>
              <span className="text-xl font-mono font-black text-white">{unlockedMedalCount} <span className="text-xs font-sans font-normal text-slate-400">/ 6</span></span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/5 flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 text-purple-300 rounded-lg shrink-0">
              <Clock3 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">累计全科学习时长</span>
              <span className="text-xl font-mono font-black text-white">{totalMinutes} <span className="text-xs font-sans font-normal text-slate-400">分钟</span></span>
            </div>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Add Bilibili & Make AI Quizzes Form (Col: 7) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl p-6 space-y-5 text-white">
            <div className="flex items-center gap-2 pb-1 border-b border-white/10">
              <div className="p-1.5 bg-rose-500/25 text-rose-300 border border-rose-500/30 rounded-lg">
                <Youtube className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-100 text-sm">极速录入 B站全科视频并智能备课成卷</h3>
            </div>

            {/* URL Validation Form */}
            <form onSubmit={handleValidateUrl} className="space-y-3">
              <label className="text-xs font-bold text-slate-300 block">输入B等外部视频链接地址 (B站 BV号/av号) :</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-3 flex items-center text-slate-450 pointer-events-none">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="bili-url-input"
                    value={biliUrl}
                    onChange={(e) => setBiliUrl(e.target.value)}
                    placeholder="输入例如: https://www.bilibili.com/video/BV17J411g7v5"
                    className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-900 border border-white/10 hover:border-white/20 focus:border-rose-500 rounded-xl focus:outline-none placeholder:text-slate-500 font-mono text-white"
                    disabled={fetchingInfo || generatingQuiz}
                  />
                </div>
                <button
                  type="submit"
                  id="bili-validate-btn"
                  disabled={fetchingInfo || generatingQuiz || !biliUrl.trim()}
                  className="px-4 py-2 bg-white/10 border border-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-slate-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shrink-0 flex items-center justify-center"
                >
                  {fetchingInfo ? (
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "解析视频"
                  )}
                </button>
              </div>
            </form>

            {/* Video retrieval preview response */}
            {retrievedVideo && (
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-4 animate-fade-in text-white">
                <div className="flex gap-3">
                  {retrievedVideo.pic && (
                    <img
                      src={retrievedVideo.pic}
                      referrerPolicy="no-referrer"
                      alt="video-pic"
                      className="w-24 h-16 object-cover rounded-xl border border-white/10 flex-shrink-0 bg-slate-800"
                    />
                  )}
                  <div className="space-y-1 min-w-0 flex-1">
                    <span className="text-[10px] bg-rose-500/25 text-rose-300 border border-rose-500/20 px-2 py-0.5 rounded-md font-bold uppercase inline-block mb-1">
                      {retrievedVideo.isFallback ? "⚠️ B站网络自适应备用模式" : "Bilibili 信息已捕获"}
                    </span>
                    {retrievedVideo.isFallback ? (
                      <div className="space-y-2 mt-1">
                        <div>
                          <label className="text-[10px] text-slate-400 font-bold block mb-0.5">自定视频标题：</label>
                          <input
                            type="text"
                            value={retrievedVideo.title || ""}
                            onChange={(e) => setRetrievedVideo({ ...retrievedVideo, title: e.target.value })}
                            className="w-full text-xs px-2.5 py-1.5 bg-slate-900 border border-white/20 hover:border-white/30 focus:border-rose-500 rounded-lg focus:outline-none text-white font-medium"
                            placeholder="例如：物理 凸透镜成像规律"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 font-bold block mb-0.5">视频 BV号 (或以 av 开头的数字号，例如 BV17J411g7v5)：</label>
                          <input
                            type="text"
                            value={retrievedVideo.bvid || (retrievedVideo.aid ? `av${retrievedVideo.aid}` : "")}
                            onChange={(e) => {
                              const val = e.target.value.trim();
                              if (val.toLowerCase().startsWith("av")) {
                                setRetrievedVideo({ 
                                  ...retrievedVideo, 
                                  aid: val.replace(/av/i, ""), 
                                  bvid: null 
                                });
                              } else {
                                setRetrievedVideo({ 
                                  ...retrievedVideo, 
                                  bvid: val, 
                                  aid: null 
                                });
                              }
                            }}
                            className="w-full text-xs px-2.5 py-1.5 bg-slate-900 border border-white/20 hover:border-white/30 focus:border-rose-500 rounded-lg focus:outline-none text-white font-medium font-mono"
                            placeholder="例如：BV17J411g7v5"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 font-bold block mb-0.5">自定考察知识重点（AI智能自适应出题）：</label>
                          <textarea
                            value={retrievedVideo.description || ""}
                            onChange={(e) => setRetrievedVideo({ ...retrievedVideo, description: e.target.value })}
                            className="w-full text-xs px-2.5 py-1.5 bg-slate-900 border border-white/20 hover:border-white/30 focus:border-rose-500 rounded-lg focus:outline-none text-white h-16 resize-none font-medium"
                            placeholder="输入你想考察学生的知识点或简介。例如：凸透镜成像实验规律，一倍焦距分虚实..."
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <h4 className="font-bold text-xs text-slate-100 leading-snug truncate">{retrievedVideo.title}</h4>
                        <p className="text-[11px] text-slate-350 font-medium truncate">UP主: {retrievedVideo.owner || "未知"} | 时长: {Math.round((retrievedVideo.duration || 120) / 60)} 分钟</p>
                      </>
                    )}
                    {retrievedVideo.pages && retrievedVideo.pages.length > 1 && (
                      <span className="inline-block text-[10px] bg-sky-500/25 text-sky-200 border border-sky-500/35 px-2 py-0.5 rounded font-black tracking-wide mt-1">
                        📚 包含 {retrievedVideo.pages.length} 集视频合集
                      </span>
                    )}
                  </div>
                </div>

                {guessedCategory && (
                  <div className="bg-blue-500/10 border border-blue-400/20 text-blue-300 rounded-xl p-3 text-xs leading-relaxed font-semibold flex items-start gap-2 animate-fade-in">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <p>AI 智能学科学情判定系统已根据视频的主题词、分集标题和简介，自动检测所属分类为：<b className="text-amber-300 underline underline-offset-2">{getCategoryName(guessedCategory)}</b>。</p>
                      <p className="text-[10px] text-slate-350 mt-1 font-normal">如AI识别出现微小偏差，可在下方的下拉菜单中随时进行手动修正。</p>
                    </div>
                  </div>
                )}

                <div className="border-t border-white/10 pt-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    
                    {/* Select Category */}
                    <div className="space-y-1">
                      <label id="label-select-category" className="text-[10px] font-bold text-slate-300 block">所属学科/版块</label>
                      <select
                        id="select-category"
                        value={selectedCategory}
                        onChange={(e: any) => setSelectedCategory(e.target.value)}
                        className="w-full text-xs p-2 bg-slate-900 border border-white/10 rounded-lg focus:outline-none text-white focus:border-blue-500"
                      >
                        <option value="chinese">语文 📚</option>
                        <option value="math">数学 📐</option>
                        <option value="english">英语 🔠</option>
                        <option value="physics">物理 ⚛️</option>
                        <option value="chemistry">化学 🧪</option>
                        <option value="biology">生物 🧬</option>
                        <option value="other">综合科普 🧭</option>
                      </select>
                    </div>

                    {/* Select Grade level */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-300 block">针对孩子学情</label>
                      <select
                        id="select-grade"
                        value={selectedGrade}
                        onChange={(e) => setSelectedGrade(e.target.value)}
                        className="w-full text-xs p-2 bg-slate-900 border border-white/10 rounded-lg focus:outline-none text-white focus:border-blue-500"
                      >
                        <option value="小学基础学情">小学阶段 (探科通识与学术综合发展)</option>
                        <option value="初中同步学情">初中段同步 (重点高频核心各科考点评测)</option>
                        <option value="中考冲刺考纲">中考冲刺层 (中高难度难关攻克与综合压轴)</option>
                      </select>
                    </div>

                    {/* Question Count */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-300 block">生成题目数</label>
                      <select
                        id="select-question-count"
                        value={questionCount}
                        onChange={(e) => setQuestionCount(Number(e.target.value))}
                        className="w-full text-xs p-2 bg-slate-900 border border-white/10 rounded-lg focus:outline-none text-white focus:border-blue-500"
                      >
                        <option value={3}>3 道选择题 (快速随堂测)</option>
                        <option value={5}>5 道选择题 (标准中考试卷)</option>
                        <option value={8}>8 道选择题 (思维魔鬼周考)</option>
                      </select>
                    </div>

                  </div>

                  <button
                    onClick={handleGenerateQuiz}
                    disabled={generatingQuiz}
                    id="btn-trigger-ai-quiz"
                    className="w-full cursor-pointer py-3 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                    根据大纲：一键构建 AI 互动评测卷
                  </button>
                </div>
              </div>
            )}

            {generatingQuiz && (
              <div className="p-6 bg-black/40 backdrop-blur-lg text-white rounded-3xl border border-white/10 space-y-4 shadow-inner text-center animate-pulse">
                <Compass className="w-10 h-10 text-blue-400 animate-spin mx-auto" />
                <div className="space-y-1.5">
                  <h4 className="font-bold text-sm text-slate-200">{getLoadingStageText()}</h4>
                  <p className="text-[11px] text-slate-450 max-w-sm mx-auto">
                    Gemini 正在分析视频背后的数理定理并构建常识概念混淆项。初学者评测涉及的公式生成大约需要 5 - 12 秒，请耐心等待！
                  </p>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden max-w-xs mx-auto">
                  <div 
                    className="bg-blue-500 h-1.5 transition-all duration-1000" 
                    style={{ width: `${(loadStage + 1) * 25}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ACTIVE MANAGEMENT: Current Curriculums Lists */}
          <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl p-6 space-y-4 text-white">
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-1.5 pb-2 border-b border-white/10">
              <BookOpen className="w-4 h-4 text-blue-400" />
              已发布全科课程大纲 ({videos.length})
            </h3>

            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {videos.map((vid) => {
                const badge = getCategoryTheme(vid.category);
                return (
                  <div key={vid.id} id={`manager-card-${vid.id}`} className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all">
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 flex-shrink-0 overflow-hidden relative">
                        {vid.pic ? (
                          <img src={vid.pic} referrerPolicy="no-referrer" alt="pic" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-blue-500/25 text-blue-300 flex items-center justify-center font-black text-xs">
                            PH
                          </div>
                        )}
                        <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 bg-slate-950/80 text-white font-mono text-[8px] rounded">
                          {Math.round((vid.duration || 120) / 60)}m
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md uppercase mr-1.5 bg-blue-500/20 text-blue-300 border border-blue-500/25`}>
                          {badge.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">{vid.gradeLevel}</span>
                        <h4 className="font-bold text-xs text-slate-100 leading-snug tracking-tight truncate mt-0.5">{vid.title}</h4>
                      </div>
                    </div>

                    <button
                      id={`btn-delete-${vid.id}`}
                      onClick={() => onDeleteVideo(vid.id)}
                      className="p-2 text-slate-400 hover:text-rose-450 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                      title="下架课程"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Diagnostic Reports & Score History (Col: 5) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl p-6 space-y-5 text-white">
            <div className="flex items-center justify-between pb-1 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-500/25 text-blue-300 border border-blue-500/20 rounded-lg">
                  <BarChart2 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-100 text-sm">诊断报告历史与错题反馈</h3>
              </div>
              {records.length > 0 && (
                <button 
                  id="btn-clear-history"
                  onClick={onClearHistory}
                  className="text-[10px] font-bold text-slate-400 hover:text-rose-400 cursor-pointer flex items-center gap-0.5"
                >
                  <ListRestart className="w-3 h-3" />
                  清空答题记录
                </button>
              )}
            </div>

            {records.length === 0 ? (
              <div className="text-center py-12 px-2 text-slate-400 space-y-2">
                <AlertCircle className="w-7 h-7 text-slate-400 mx-auto" />
                <p className="text-xs font-medium leading-relaxed text-slate-350">暂时没有答题历史，去给孩子换个视频，让他登录学生中心进行作答测试吧！</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
                {records.map((rec) => {
                  const isExpanded = expandedRecordId === rec.id;
                  const recordVideo = videos.find(v => v.id === rec.videoId);

                  return (
                    <div 
                      key={rec.id} 
                      id={`record-${rec.id}`}
                      className="bg-white/5 border border-white/5 hover:bg-white/10 rounded-2xl p-4 transition-all"
                    >
                      {/* Interactive Header to Expand */}
                      <button
                        onClick={() => setExpandedRecordId(isExpanded ? null : rec.id)}
                        className="w-full text-left flex items-start justify-between gap-3 cursor-pointer text-white"
                      >
                        <div className="min-w-0">
                          <span className="text-[10px] text-slate-450 font-bold font-mono">
                            {new Date(rec.completedAt).toLocaleString("zh-CN", {
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                          <h4 className="font-bold text-xs text-slate-100 leading-snug truncate mt-0.5">
                            {rec.videoTitle}
                          </h4>
                          <span className="text-[10px] font-semibold text-slate-350 mt-1 block">
                            答对数：{rec.correctCount} / {rec.totalQuestions} 道题
                          </span>
                        </div>
                        <div className={`px-2.5 py-1.5 rounded-xl font-mono text-xs font-black text-center shrink-0 ${
                          rec.score === 100 
                            ? "bg-amber-500/25 text-amber-300 border border-amber-500/30" 
                            : rec.score >= 80 
                            ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/30" 
                            : "bg-blue-500/25 text-blue-300 border border-blue-500/30"
                        }`}>
                          {rec.score}分
                        </div>
                      </button>

                      {/* Expand diagnostic details block */}
                      {isExpanded && recordVideo && recordVideo.quizData && (
                        <div className="mt-4 pt-3 border-t border-white/10 text-xs space-y-3 animate-fade-in text-slate-200">
                          <span className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider block">
                            试题错点明细诊断:
                          </span>
                          <div className="space-y-2.5">
                            {recordVideo.quizData.questions.map((q) => {
                              const kidAnswerIdx = rec.answers[q.id];
                              const wasCorrect = kidAnswerIdx === q.correctAnswer;

                              return (
                                <div key={q.id} className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-1">
                                  <div className="flex items-start gap-1 justify-between font-semibold text-slate-100 leading-relaxed text-xs">
                                    <span>{q.id}. {q.question}</span>
                                    {wasCorrect ? (
                                      <span className="text-emerald-400 text-[10px] shrink-0 font-bold">✔ 对</span>
                                    ) : (
                                      <span className="text-rose-400 text-[10px] shrink-0 font-bold font-mono">✘ 错</span>
                                    )}
                                  </div>

                                  <div className="text-[10px] flex gap-2 font-medium text-slate-400 mt-1 pb-1">
                                    <span>孩子选择: <strong className={wasCorrect ? "text-emerald-400" : "text-rose-400"}>
                                      {kidAnswerIdx !== undefined && kidAnswerIdx !== -1 
                                        ? String.fromCharCode(65 + kidAnswerIdx) + " (" + q.options[kidAnswerIdx] + ")" 
                                        : "未答"}
                                    </strong></span>
                                    {!wasCorrect && (
                                      <span>正确选项: <strong className="text-emerald-400">
                                        {String.fromCharCode(65 + q.correctAnswer)} ({q.options[q.correctAnswer]})
                                      </strong></span>
                                    )}
                                  </div>

                                  {!wasCorrect && (
                                    <div className="pt-1 border-t border-white/5 text-[10px] text-amber-200 leading-relaxed bg-amber-500/10 p-2 rounded">
                                      <strong>AI 难点分析：</strong>{q.explanation}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
