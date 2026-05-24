import { useState } from "react";
import { 
  Tv, 
  Sparkles, 
  Compass, 
  ChevronRight, 
  Flame, 
  Award, 
  HelpCircle, 
  ArrowLeft,
  ChevronDown,
  Info,
  Layers,
  Zap,
  BookOpen,
  Globe,
  Percent,
  Activity,
  FileText,
  Brain
} from "lucide-react";
import { BiliVideo, Medal, StudyRecord } from "../types";

interface ChildDashboardProps {
  videos: BiliVideo[];
  medals: Medal[];
  records: StudyRecord[];
  onStartQuiz: (video: BiliVideo) => void;
  onOpenFormulaBox: () => void;
  onUpdateVideo: (updatedVideo: BiliVideo) => void;
}

export default function ChildDashboard({ 
  videos, 
  medals, 
  records, 
  onStartQuiz,
  onOpenFormulaBox,
  onUpdateVideo
}: ChildDashboardProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedVideo, setSelectedVideo] = useState<BiliVideo | null>(null);
  const [activePartIndex, setActivePartIndex] = useState<number>(0);
  const [generatingPartQuiz, setGeneratingPartQuiz] = useState<boolean>(false);
  const [showFormulaTip, setShowFormulaTip] = useState<string | null>(null);
  const [cheatSheetSubject, setCheatSheetSubject] = useState<string>("chinese");
  const [activeTab, setActiveTab] = useState<"reading" | "eval">("reading");

  const getSubjectIcon = (name: string) => {
    switch (name) {
      case "BookOpen": return <BookOpen className="w-5 h-5 text-red-400" />;
      case "Globe": return <Globe className="w-5 h-5 text-pink-400" />;
      case "Percent": return <Percent className="w-5 h-5 text-cyan-400" />;
      case "Zap": return <Zap className="w-5 h-5 text-blue-400 animate-pulse" />;
      case "Layers": return <Layers className="w-5 h-5 text-emerald-400" />;
      case "Activity": return <Activity className="w-5 h-5 text-indigo-400" />;
      default: return <Compass className="w-5 h-5 text-amber-400" />;
    }
  };

  const getSubjectRevisionConfig = (category: string) => {
    const norm = category ? category.toLowerCase() : "";
    switch (norm) {
      case "chinese":
        return {
          title: "🏮 本课核心字词与语文经典词法复习",
          badgeLabel: "词义 / 文法结构",
          buttonLabel: "温习好字音文法？",
          icon: "BookOpen"
        };
      case "english":
        return {
          title: "🔠 本课核心句型搭配与语法结构复习",
          badgeLabel: "地道句型 / 时态",
          buttonLabel: "温习好英语语法？",
          icon: "Globe"
        };
      case "math":
        return {
          title: "📐 本课核心几何定理与数学公式复习",
          badgeLabel: "核心公式",
          buttonLabel: "温习好几何公式？",
          icon: "Percent"
        };
      case "physics":
      case "mechanics":
      case "optics":
      case "acoustics":
      case "thermal":
      case "electromagnetics":
        return {
          title: "⚛️ 本课核心物理法则与计算公式复习",
          badgeLabel: "物理公式",
          buttonLabel: "温习好物理定律？",
          icon: "Zap"
        };
      case "chemistry":
        return {
          title: "🧪 本课核心化学反应式与实验要点复习",
          badgeLabel: "反应式 / 规律",
          buttonLabel: "温习好化学变化？",
          icon: "Layers"
        };
      case "biology":
        return {
          title: "🧬 本课核心生命概念与常考规律复习",
          badgeLabel: "生命法则",
          buttonLabel: "温习好生命概念？",
          icon: "Activity"
        };
      default:
        return {
          title: "🧭 本课学科核心概念与通识学考常识复习",
          badgeLabel: "核心概念",
          buttonLabel: "温习好全科重点？",
          icon: "Compass"
        };
    }
  };

  const getSubjectSidebarConfig = (category: string) => {
    const norm = category ? category.toLowerCase() : "";
    switch (norm) {
      case "chinese":
        return {
          factTitle: "🏮 文艺常识与文学名家逸闻",
          actTitle: "✍️ 妙笔生花：深度思考与写作实践",
          factColor: "border-red-500/25",
          actColor: "border-emerald-500/25"
        };
      case "english":
        return {
          factTitle: "🌍 英美文化背景与地道表达点拨",
          actTitle: "🗣️ 地道演练：五分钟口语拼读小课堂",
          factColor: "border-pink-500/25",
          actColor: "border-fuchsia-500/25"
        };
      case "math":
        return {
          factTitle: "📐 数数定理演进与学霸思维启发",
          actTitle: "✏️ 脑力锤炼：逻辑推演与趣味算术微挑战",
          factColor: "border-cyan-500/25",
          actColor: "border-teal-500/25"
        };
      case "chemistry":
        return {
          factTitle: "🧪 反应神奇小贴士与分子变温大奥秘",
          actTitle: "🔬 动手探究：神奇且安全的家庭变色化学箱",
          factColor: "border-emerald-500/25",
          actColor: "border-blue-500/25"
        };
      case "biology":
        return {
          factTitle: "🧬 生物生命规律奇趣大观与逸学常识",
          actTitle: "🌿 绿野寻踪：家庭生命树对照微观察",
          factColor: "border-indigo-500/25",
          actColor: "border-amber-500/25"
        };
      default: // physics / other
        return {
          factTitle: "⚛️ 物理探索史话与学科常识背景",
          actTitle: "🔌 科学实验：利用身边塑料吸管纸片动手验证",
          factColor: "border-blue-500/25",
          actColor: "border-indigo-500/25"
        };
    }
  };

  const renderArticleContent = (text: string) => {
    if (!text) return null;
    return text.split("\n\n").map((para, idx) => {
      const trimmed = para.trim();
      if (trimmed.startsWith("###")) {
        const titleText = trimmed.replace("###", "").trim();
        return (
          <h4 key={idx} className="text-sm md:text-base font-extrabold text-[#fcd34d] tracking-wide mt-5 mb-3 border-l-4 border-amber-500 pl-3">
            {titleText}
          </h4>
        );
      }
      
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;
      while ((match = boldRegex.exec(trimmed)) !== null) {
        if (match.index > lastIndex) {
          parts.push(trimmed.substring(lastIndex, match.index));
        }
        parts.push(
          <strong key={match.index} className="text-amber-300 font-extrabold mx-0.5 underline decoration-amber-500/40">
            {match[1]}
          </strong>
        );
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < trimmed.length) {
        parts.push(trimmed.substring(lastIndex));
      }

      return (
        <p key={idx} className="text-[13px] md:text-sm text-slate-100 leading-relaxed font-normal mb-4 text-left">
          {parts.length > 0 ? parts : trimmed}
        </p>
      );
    });
  };

  // Category mapper
  const categories = [
    { id: "all", name: "全部学科" },
    { id: "chinese", name: "语文 📚" },
    { id: "math", name: "数学 📐" },
    { id: "english", name: "英语 🔠" },
    { id: "physics", name: "物理 ⚛️" },
    { id: "chemistry", name: "化学 🧪" },
    { id: "biology", name: "生物 🧬" },
    { id: "other", name: "综合科普 🧭" },
    { id: "mechanics", name: "力学 ⛵" },
    { id: "optics", name: "光学 🌈" },
    { id: "acoustics", name: "声学 📣" },
    { id: "thermal", name: "热学 🌡" },
    { id: "electromagnetics", name: "电磁学 ⚡" }
  ];

  const filteredVideos = activeCategory === "all"
    ? videos
    : videos.filter(v => v.category === activeCategory);

  const getCategoryTheme = (cat: string) => {
    switch (cat) {
      case "chinese": return { name: "语文", color: "bg-red-50 text-red-600 border border-red-100" };
      case "math": return { name: "数学", color: "bg-cyan-50 text-cyan-600 border border-cyan-100" };
      case "english": return { name: "英语", color: "bg-pink-50 text-pink-600 border border-pink-100" };
      case "physics": return { name: "物理", color: "bg-blue-50 text-blue-600 border border-blue-100" };
      case "chemistry": return { name: "化学", color: "bg-emerald-50 text-emerald-600 border border-emerald-100" };
      case "biology": return { name: "生物", color: "bg-indigo-50 text-indigo-600 border border-indigo-100" };
      case "mechanics": return { name: "力学", color: "bg-blue-50 text-blue-600 border border-blue-100" };
      case "optics": return { name: "光学", color: "bg-amber-50 text-amber-600 border border-amber-100" };
      case "acoustics": return { name: "声学", color: "bg-teal-50 text-teal-600 border border-teal-100" };
      case "thermal": return { name: "热学", color: "bg-orange-50 text-orange-600 border border-orange-100" };
      case "electromagnetics": return { name: "电磁学", color: "bg-purple-50 text-purple-600 border border-purple-100" };
      default: return { name: "综合科普", color: "bg-slate-50 text-slate-600 border border-slate-100" };
    }
  };

  const getAccuracyColor = (score: number) => {
    if (score === 100) return "text-amber-600 bg-amber-50 border border-amber-150";
    if (score >= 80) return "text-emerald-600 bg-emerald-50 border border-emerald-150";
    return "text-blue-600 bg-blue-50 border border-blue-150";
  };

  return (
    <div className="space-y-8">
      
      {/* Visual Header card */}
      <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-purple-900/40 backdrop-blur-xl border border-white/10 text-white rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-44 h-44 bg-blue-400/20 opacity-20 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-xs bg-white/20 border border-white/30 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider inline-block text-blue-200">
              🚀 探客小剧场 & 荣誉殿堂
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              全科自主成长学习与智能测评中心
            </h1>
            <p className="text-xs text-slate-300 max-w-xl">
              在这里，你可以看趣味全科微课、操作神奇数理化实验。学完视频后，点击“开始脑力测评”，向AI特级名师证明你的超凡学科实力，赢取专属荣誉勋章！
            </p>
          </div>
          <button
            onClick={onOpenFormulaBox}
            id="quick-formula-sandbox"
            className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 border border-white/15 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer shadow-lg self-start md:self-center font-sans"
          >
            <Compass className="w-4 h-4 text-slate-100" />
            开启公式实验箱
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE VIDEO PLAY THEATER DETAIL */}
      {selectedVideo && (() => {
        const isSeries = selectedVideo.parts && selectedVideo.parts.length > 1;
        const activePart = isSeries ? selectedVideo.parts![activePartIndex] : null;

        const currentReading = activePart ? activePart.readingMaterial : selectedVideo.readingMaterial;
        const currentQuizData = activePart ? activePart.quizData : selectedVideo.quizData;
        const isQuizReady = activePart ? activePart.quizGenerated : selectedVideo.quizGenerated;

        const handleLaunchQuiz = () => {
          if (activePart) {
            if (activePart.quizData) {
              const clonedVideo: BiliVideo = {
                ...selectedVideo,
                title: `${selectedVideo.title}（第 ${activePart.page} 集：${activePart.title}）`,
                quizData: activePart.quizData,
                readingMaterial: activePart.readingMaterial
              };
              onStartQuiz(clonedVideo);
            }
          } else {
            onStartQuiz(selectedVideo);
          }
        };

        const handleGeneratePartQuiz = async () => {
          if (!selectedVideo || !selectedVideo.parts) return;
          const part = selectedVideo.parts[activePartIndex];
          setGeneratingPartQuiz(true);
          try {
            const response = await fetch("/api/quiz/generate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: `${selectedVideo.title}（第 ${part.page} 集：${part.title}）`,
                description: selectedVideo.description,
                category: selectedVideo.category,
                gradeLevel: selectedVideo.gradeLevel,
                questionCount: 5
              })
            });
            const resJson = await response.json();
            if (resJson.success && resJson.data) {
              const generated = resJson.data;
              const updatedParts = [...selectedVideo.parts];
              updatedParts[activePartIndex] = {
                ...part,
                quizGenerated: true,
                quizData: generated,
                readingMaterial: generated.readingMaterial
              };
              const updatedVideo: BiliVideo = {
                ...selectedVideo,
                parts: updatedParts
              };
              setSelectedVideo(updatedVideo);
              onUpdateVideo(updatedVideo);
            }
          } catch (err) {
            console.error(err);
          } finally {
            setGeneratingPartQuiz(false);
          }
        };

        return (
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/15 text-white rounded-3xl p-6 shadow-2xl space-y-5 animate-fade-in relative z-10 animate-fade-in">
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-xs font-medium cursor-pointer"
            >
              收起影院 ✕
            </button>

            <div className="flex items-center gap-2">
              <span className="p-1 px-2.5 bg-rose-600/30 border border-rose-500/40 text-[10px] font-black tracking-widest rounded text-rose-300 uppercase animate-pulse">
                LIVE 全科微课堂
              </span>
              <h2 className="text-base font-bold text-slate-100 pr-12 leading-relaxed">
                {selectedVideo.title}
                {isSeries && activePart && (
                  <span className="text-sm font-semibold text-sky-400 block mt-1">
                    第 {activePart.page} 集：{activePart.title}
                  </span>
                )}
              </h2>
            </div>

            {/* High Fidelity Embedded Bilibili Player with proper responsiveness and restricted sandbox permissions to prevent external App transitions */}
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-white/10 shadow-2xl">
              <iframe
                src={`//player.bilibili.com/player.html?bvid=${selectedVideo.bvid}&high_quality=1&page=${activePartIndex + 1}&as_wide=1&autoplay=0&danmaku=0`}
                scrolling="no"
                border="0"
                frameBorder="no"
                framespacing="0"
                allowFullScreen={true}
                sandbox="allow-same-origin allow-scripts allow-forms"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share inline-playback-quality-control"
                className="absolute inset-0 w-full h-full"
              />
            </div>

            {/* Bilibili-style Playlist selector panel */}
            {isSeries && selectedVideo.parts && (
              <div className="space-y-2 p-4 bg-black/30 border border-white/5 rounded-2xl text-left">
                <div className="flex items-center justify-between text-xs pb-1 border-b border-white/5">
                  <span className="font-extrabold text-[#fcd34d] tracking-wide flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-500" />
                    视频选集 (共 {selectedVideo.parts.length} 集)
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">
                    当前播放: P{activePartIndex + 1}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 pt-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                  {selectedVideo.parts.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setActivePartIndex(idx);
                        setActiveTab("reading");
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold select-none cursor-pointer transition-all border text-left flex items-center gap-1.5 ${
                        activePartIndex === idx
                          ? "bg-gradient-to-r from-blue-600 to-indigo-650 text-white border-blue-500 shadow-md font-bold"
                          : "bg-white/5 text-slate-300 border-white/5 hover:bg-white/10"
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                        activePartIndex === idx ? "bg-white text-blue-600" : "bg-white/10 text-slate-300"
                      }`}>
                        {p.page}
                      </span>
                      <span className="truncate max-w-[120px] md:max-w-[200px]">{p.title}</span>
                      {p.quizGenerated ? (
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-medium">已评测</span>
                      ) : (
                        <span className="text-[9px] bg-sky-500/20 text-sky-305 border border-sky-500/30 px-1.5 py-0.2 rounded font-medium">未激活</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* If the selected part has not had its quiz/materials compiled yet, show activation banner */}
            {isSeries && !isQuizReady ? (
              <div className="bg-slate-950/60 border border-dashed border-white/10 rounded-3xl p-6 text-center space-y-4 py-12 animate-fade-in">
                {generatingPartQuiz ? (
                  <div className="space-y-4 py-4 animate-pulse">
                    <Sparkles className="w-10 h-10 text-amber-450 animate-spin mx-auto" />
                    <div className="space-y-1.5">
                      <h4 className="font-bold text-sm text-amber-200">✨ AI 特级名师正在极速备课中...</h4>
                      <p className="text-[11px] text-slate-350 max-w-sm mx-auto">
                        正在解析第 {activePartIndex + 1} 集《{activePart?.title}》的知识点细节，并调遣 Gemini 配置本门学科专属测试大纲与趣味拓展。很快就能生成专属趣味拓展科普与测试题哟，请稍候 5 - 10 秒！
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-sky-500/10 border border-sky-500/30 text-sky-400 rounded-full flex items-center justify-center mx-auto">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div className="space-y-1.5 text-center">
                      <h3 className="font-bold text-slate-100 text-sm">
                        当前播放 P{activePart?.page}：《{activePart?.title}》 尚未激活测评
                      </h3>
                      <p className="text-xs text-slate-350 max-w-md mx-auto leading-relaxed">
                        这一集包含全新的重难点和核心考点！快点击下方召唤 AI 老师，为你定制这一分集的趣味科普和全科测评卷吧！
                      </p>
                    </div>
                    <button
                      onClick={handleGeneratePartQuiz}
                      id="btn-live-generate-part"
                      className="px-6 py-2.5 bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-650 hover:from-sky-600 hover:to-indigo-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-lg inline-flex items-center gap-1.5 ml-auto mr-auto select-none"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-305 fill-amber-305 animate-pulse" />
                      一键快速激活：解析本集并生成评测
                    </button>
                  </>
                )}
              </div>
            ) : (
              <>
                {/* Tabs Switcher for extension reading vs quiz and formulas */}
                <div className="flex border-b border-white/10 gap-2">
                  <button
                    onClick={() => setActiveTab("reading")}
                    className={`pb-2.5 px-4 text-xs font-black tracking-wide cursor-pointer border-b-2 transition-all flex items-center gap-1.5 ${
                      activeTab === "reading"
                        ? "border-amber-450 text-amber-400 font-black"
                        : "border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    科普拓展趣味阅读 (适合初中生)
                  </button>
                  <button
                    onClick={() => setActiveTab("eval")}
                    className={`pb-2.5 px-4 text-xs font-black tracking-wide cursor-pointer border-b-2 transition-all flex items-center gap-1.5 ${
                      activeTab === "eval"
                        ? "border-blue-450 text-blue-400 font-black"
                        : "border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    核心公式与测评
                  </button>
                </div>

                {/* TAB 1: COPULA READING MATERIAL */}
                {activeTab === "reading" && (
                  <div className="space-y-4 animate-fade-in">
                    {currentReading ? (
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mt-2">
                        {/* Left: Article core */}
                        <div className="md:col-span-8 bg-slate-950/70 border border-slate-800 rounded-3xl p-5 md:p-6 space-y-4">
                          <div className="flex items-center gap-2 pb-2.5 border-b border-white/10 mb-1 text-left">
                            <BookOpen className="w-5 h-5 text-amber-400" />
                            <h3 className="text-sm md:text-base font-extrabold text-[#fcd34d] tracking-wide uppercase font-sans">
                              {currentReading.title}
                            </h3>
                          </div>
                          <div className="max-h-[350px] overflow-y-auto pr-2 custom-scrollbar text-left space-y-2">
                            {renderArticleContent(currentReading.content)}
                          </div>
                        </div>

                        {/* Right: Fun facts list and Suggested Lab activity */}
                        {(() => {
                          const sideCfg = getSubjectSidebarConfig(selectedVideo.category);
                          return (
                            <div className="md:col-span-4 flex flex-col gap-5">
                              {/* Fun facts bubble list */}
                              <div className={`bg-slate-950/75 border ${sideCfg.factColor} rounded-2xl p-5 space-y-3.5 flex-1`}>
                                <div className="flex items-center gap-2 pb-2 border-b border-white/10 text-left">
                                  <Brain className="w-4.5 h-4.5 text-amber-400" />
                                  <h4 className="text-xs md:text-sm font-extrabold text-amber-300 tracking-wider uppercase">
                                    {sideCfg.factTitle}
                                  </h4>
                                </div>
                                <ul className="space-y-3.5 max-h-[160px] overflow-y-auto custom-scrollbar pr-1 text-left">
                                  {currentReading.funFacts.map((fact, idx) => (
                                    <li key={idx} className="text-xs md:text-[13px] text-slate-100 leading-relaxed border-l-2 border-indigo-500/50 pl-2.5 font-normal">
                                      {fact}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* Simple hands-on or mental challenge activity */}
                              <div className={`bg-slate-950/75 border ${sideCfg.actColor} rounded-2xl p-5 space-y-3`}>
                                <div className="flex items-center gap-2 pb-2 border-b border-white/10 text-left">
                                  <Sparkles className="w-4.5 h-4.5 text-blue-400" />
                                  <h4 className="text-xs md:text-sm font-extrabold text-blue-300 tracking-wider">
                                    {sideCfg.actTitle}
                                  </h4>
                                </div>
                                <p className="text-xs md:text-[13px] text-slate-150 leading-relaxed pl-1 max-h-[120px] overflow-y-auto custom-scrollbar pr-1 text-left font-normal whitespace-pre-line">
                                  {currentReading.suggestedActivity}
                                </p>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center space-y-2 mt-2 text-slate-400 py-10">
                        <Sparkles className="w-8 h-8 text-amber-400/50 mx-auto animate-pulse" />
                        <p className="text-xs font-bold text-slate-300">本课程正在精编科普拓展阅读中...</p>
                        <p className="text-[10px] text-slate-400 max-w-md mx-auto">
                          可在「家长控制台」重新添加或点击一键重新生成本视频卷，即可自动配套高品质的AI科普知识阅读与测评噢！
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: ACTIVE REVISION QUESTIONS CONTEXT */}
                {activeTab === "eval" && (
                  <div className="space-y-5 animate-fade-in mt-2">
                    <div className="bg-slate-950/90 border-2 border-amber-500/30 rounded-2xl p-6 space-y-3.5 text-left shadow-2xl">
                      <span className="text-base md:text-lg text-amber-300 font-black flex items-center gap-1.5 tracking-wide">
                        💡 本分集视频深度总结 (Topic Summary)
                      </span>
                      <p className="text-sm md:text-base leading-relaxed text-slate-100 font-medium">
                        {currentQuizData ? currentQuizData.topicSummary : selectedVideo.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      {/* Equations/Concepts list */}
                      {(() => {
                        const revCfg = getSubjectRevisionConfig(selectedVideo.category);
                        return (
                          <div className="md:col-span-7 bg-slate-950/90 border-2 border-indigo-500/30 rounded-2xl p-6 space-y-4 text-left shadow-2xl">
                            <h5 className="text-base md:text-lg font-black text-indigo-300 flex items-center gap-2 tracking-wide">
                              {getSubjectIcon(revCfg.icon)}
                              {revCfg.title}
                            </h5>
                            {currentQuizData && currentQuizData.keyFormulas && currentQuizData.keyFormulas.length > 0 ? (
                              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 dataset-scrollbar">
                                {currentQuizData.keyFormulas.map((form, idx) => (
                                  <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center gap-4 hover:border-indigo-400/50 hover:bg-white/10 transition-all shadow-md">
                                    <div className="space-y-1.5 flex-1 select-text">
                                      <span className="text-sm md:text-base text-white font-extrabold block leading-snug">{form.name}</span>
                                      <p className="text-xs md:text-sm text-slate-205 leading-relaxed font-normal">{form.desc}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                                      <span className="text-[9px] font-bold text-indigo-300 bg-indigo-500/15 border border-indigo-400/20 px-2 py-0.5 rounded uppercase">
                                        {revCfg.badgeLabel}
                                      </span>
                                      <span className="font-mono bg-indigo-500/20 border border-indigo-400/50 px-3.5 py-1.5 rounded-xl text-xs md:text-sm text-amber-200 font-extrabold tracking-wider shrink-0 shadow-md">
                                        {form.expression}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-slate-200 pl-2 py-4 font-normal leading-relaxed">
                                本课属于趣味学科综合探索，浏览重温上面的背景重点介绍，即可信心大增发起互动测评卷！
                              </p>
                            )}
                          </div>
                        );
                      })()}

                      {/* Main Action Block to Start quiz */}
                      {(() => {
                        const revCfg = getSubjectRevisionConfig(selectedVideo.category);
                        return (
                          <div className="md:col-span-5 bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-white/10 rounded-2xl p-4 flex flex-col justify-center items-center text-center space-y-3">
                            <Tv className="w-8 h-8 text-amber-400 animate-bounce" />
                            <div>
                              <h4 className="text-xs font-black text-slate-100">{revCfg.buttonLabel}</h4>
                              <p className="text-[9px] text-slate-400 mt-1 max-w-[200px]">
                                向 AI 专属特级名师发起匹配中高考考纲的高质量定制评测卷！
                              </p>
                            </div>

                            {isQuizReady && currentQuizData ? (
                              <button
                                id="btn-trigger-quiz"
                                onClick={handleLaunchQuiz}
                                className="w-full px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-650 text-slate-950 font-black text-xs rounded-xl tracking-wider transition-all transform scale-[1.01] hover:scale-[1.03] flex items-center justify-center gap-1.5 cursor-pointer shadow-lg uppercase select-none"
                              >
                                我准备好了・开启评测
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400 font-bold shrink-0">家长正在生成此课程测试中...</span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })()}

      {/* MID SECTION: Videos Grid Filter Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Grid list of physics courses (Col: 8) */}
        <div className="lg:col-span-8 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1.5 border-b border-white/10">
            <h3 className="font-extrabold text-slate-100 text-sm flex items-center gap-2">
              <Tv className="w-4 h-4 text-rose-400" />
              全科微网课学习大厅
            </h3>

            {/* Filter tags */}
            <div className="flex flex-wrap gap-1">
              {categories.map((c) => (
                <button
                  key={c.id}
                  id={`cat-filter-${c.id}`}
                  onClick={() => setActiveCategory(c.id)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg cursor-pointer transition-all ${
                    activeCategory === c.id
                      ? "bg-blue-600/60 text-white border border-blue-400/40 backdrop-blur-md shadow-lg"
                      : "bg-white/5 hover:bg-white/10 text-slate-350 border border-white/10"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {filteredVideos.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-12 text-center text-slate-400 space-y-2 py-16">
              <Compass className="w-10 h-10 text-slate-400 mx-auto animate-spin-slow" />
              <p className="text-xs font-bold text-slate-300">该范畴内暂时还没有视频！</p>
              <p className="text-[11px] text-slate-400">可以呼唤爸爸妈妈，在家长控制台里一键添加你想学习的B站视频链接噢！</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredVideos.map((vid) => {
                const bdf = getCategoryTheme(vid.category);
                const rec = records.find(r => r.videoId === vid.id);

                return (
                  <div 
                    key={vid.id} 
                    id={`child-vid-card-${vid.id}`}
                    onClick={() => {
                      setSelectedVideo(vid);
                      setActivePartIndex(0);
                      setActiveTab("reading");
                      // Scroll to target screen simply
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="bg-white/5 backdrop-blur-md border border-white/10 hover:border-blue-400/40 rounded-2xl hover:bg-white/10 shadow-lg hover:shadow-xl transition-all p-3 cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      {/* Video Banner */}
                      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-900 border border-white/5">
                        {vid.pic ? (
                          <img 
                            src={vid.pic} 
                            referrerPolicy="no-referrer"
                            alt="video-pic" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 bg-slate-800"
                          />
                        ) : (
                          <div className="w-full h-full bg-blue-950 text-blue-300 flex items-center justify-center font-bold text-[11px]">
                            科教视频
                          </div>
                        )}
                        <span className="absolute bottom-1.5 right-1.5 px-2 py-0.5 bg-slate-950/85 backdrop-blur-xs text-white text-[9px] font-mono rounded font-bold">
                          {Math.round((vid.duration || 120) / 60)} 分钟
                        </span>

                        {rec && (
                          <span className={`absolute top-1.5 left-1.5 px-2 py-0.5 backdrop-blur-xs rounded font-mono text-[9px] font-black uppercase ${getAccuracyColor(rec.score)}`}>
                            最新成绩：{rec.score}分
                          </span>
                        )}
                      </div>

                      {/* Content block */}
                      <div className="mt-3 space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] font-black px-2 py-0.2 rounded-md uppercase ${bdf.color}`}>
                            {bdf.name}
                          </span>
                          <span className="text-[10px] text-slate-300 font-bold">{vid.gradeLevel}</span>
                        </div>
                        <h4 className="font-black text-xs text-slate-100 leading-snug group-hover:text-blue-300 transition-colors line-clamp-2">
                          {vid.title}
                        </h4>
                      </div>
                    </div>

                    <div className="mt-4 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs font-bold text-slate-350 group-hover:text-blue-300 transition-all">
                      <span>{vid.owner || "趣味学堂UP主"}</span>
                      <span className="flex items-center gap-0.5 text-[11px] font-extrabold text-blue-400 opacity-0 group-hover:opacity-100 transition-all">
                        开始播放学习
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Medals Achievements Room and formulas book (Col: 4) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* INTERACTIVE HONOR MEDAL CABINET */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
              <h3 className="font-extrabold text-slate-200 text-xs tracking-wide flex items-center gap-1.5 uppercase">
                <Award className="w-4 h-4 text-amber-400 fill-amber-500/10" />
                科学荣誉奖勋陈列厅
              </h3>
              <span className="text-[10px] bg-white/10 text-slate-200 border border-white/10 rounded px-2 py-0.5 font-mono font-black">
                {medals.filter(m => m.unlockedAt).length} / 6
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {medals.map((m) => {
                const isUnlocked = m.unlockedAt !== undefined;
                return (
                  <div 
                    key={m.id} 
                    id={`medal-${m.id}`}
                    className={`p-2.5 rounded-2xl flex flex-col items-center justify-center text-center transition-all border relative group ${
                      isUnlocked 
                        ? "bg-white/10 hover:bg-white/15 border-white/15 cursor-pointer" 
                        : "bg-white/5 border-white/5 grayscale saturate-50 hover:grayscale-[30%]"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${
                      isUnlocked ? m.color : "bg-slate-900/50 text-slate-600"
                    }`}>
                      <Award className="w-5 h-5" />
                    </div>
                    <span className={`text-[9px] font-black mt-1.5 block leading-tight ${isUnlocked ? "text-slate-200" : "text-slate-450"}`}>
                      {m.title}
                    </span>

                    {/* Simple native tooltips using absolute positioning */}
                    <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-slate-905/95 backdrop-blur-md text-white p-2 rounded-xl text-[9px] text-center leading-normal shadow-md z-30 transition-opacity whitespace-normal font-normal border border-white/10">
                      <strong>{m.title}</strong>
                      <p className="text-slate-350 mt-0.5">{m.description}</p>
                      {isUnlocked && <p className="text-amber-400 mt-0.5 font-bold">已解锁 ✓</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* INTERACTIVE ALL-SUBJECT SCHOLAR CHEAT BOX & CORE CONCEPTS DECK */}
          <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-3xl shadow-2xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg text-white shadow-sm">
                  <BookOpen className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-100 text-sm tracking-tight">
                    全科中考高分密码 & 学霸备考重难宝典
                  </h3>
                  <p className="text-[10px] text-slate-400">精挑细选高价值学科金句、常背公式、答题模板与避坑攻略</p>
                </div>
              </div>
            </div>

            {/* Subject Selector Buttons */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 p-1 bg-white/5 rounded-xl border border-white/5">
              {[
                { id: "chinese", label: "语文 📚", color: "hover:bg-red-500/10 hover:text-red-300", activeBg: "bg-red-500/20 text-red-300 border-red-500/30" },
                { id: "math", label: "数学 📐", color: "hover:bg-cyan-500/10 hover:text-cyan-300", activeBg: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
                { id: "english", label: "英语 🔠", color: "hover:bg-pink-500/10 hover:text-pink-300", activeBg: "bg-pink-500/20 text-pink-300 border-pink-500/30" },
                { id: "physics", label: "物理 ⚛️", color: "hover:bg-blue-500/10 hover:text-blue-300", activeBg: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
                { id: "chemistry", label: "化学 🧪", color: "hover:bg-emerald-500/10 hover:text-emerald-300", activeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
                { id: "biology", label: "生物 🧬", color: "hover:bg-indigo-500/10 hover:text-indigo-300", activeBg: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" }
              ].map(sub => {
                const isActive = cheatSheetSubject === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => {
                      setCheatSheetSubject(sub.id);
                      setShowFormulaTip(null);
                    }}
                    className={`px-1 py-1.5 rounded-lg text-[11px] font-bold text-slate-350 transition-all border border-transparent cursor-pointer ${
                      isActive ? `${sub.activeBg} shadow-md` : `${sub.color}`
                    }`}
                  >
                    {sub.label}
                  </button>
                );
              })}
            </div>

            {/* Dynamic Card Deck matching currently selected Subject */}
            <div className="space-y-3.5">
              {(() => {
                const cheatSheetData: Record<string, Array<{ name: string; formula: string; desc: string; trap: string; badge?: string }>> = {
                  chinese: [
                    {
                      name: "修辞手法高分答题公式与模板 📝",
                      formula: "修辞名称 + 具体内容 + 核心情感",
                      desc: "答题标准模版：本句使用了【XX】的修辞手法，生动形象地描摹了【对象】的【特征】，烘托/渲染了【画面/气氛】，从而深刻升华了作者对【对象】的【何种思想感情】。",
                      trap: "⚠️ 提分警示：绝不能一笔带过写‘生动形象’！一定要紧密结合句中的动词/形容词，说出渲染了什么情调、蕴含了作者怎样的赞美或忧愤。",
                      badge: "现代文阅读常客"
                    },
                    {
                      name: "文言文实词活用快速识别 📚",
                      formula: "名词处在谓语位 => 活用作动词",
                      desc: "如果一个名词后紧跟代词或者名词宾语，或者前面被副词/能愿动词修饰，该名词则活用为动词。例如《出师表》‘一狼洞其中’中‘洞’意为‘挖洞’。",
                      trap: "⚠️ 典型失分项：生搬硬套现代语意。翻译活用词时，先判明词性转换（名词作动词、形容词作动词等），再准确顺畅译出其动作意图。",
                      badge: "文言文重难点"
                    },
                    {
                      name: "古典诗歌意境概括三步法 🌸",
                      formula: "描绘画面 + 归纳情调 + 点明主旨",
                      desc: "步骤：1. 用自己的话生动描摹诗中的意象与特写画面；2. 用‘清新明丽’‘雄浑悲壮’‘萧瑟凄凉’等专属词汇提炼意境；3. 结合贬谪、报国、忆友等剖析诗人的心境。",
                      trap: "⚠️ 备考技巧：重点关注诗歌最后两句（绝句的转折，律诗的尾联），那往往是诗人借景抒情、卒章显志的灵魂所在，不可漏答情感落脚点。",
                      badge: "考前必看"
                    }
                  ],
                  math: [
                    {
                      name: "直角三角形勾股定理 📐",
                      formula: "a² + b² = c²  => c = √(a² + b²)",
                      desc: "直角三角形中两个直角边a, b的平方和等于斜边c的平方。常与平面几何的‘面积等积法’（底乘高除以2恒等）连缀作答，求解斜边高段长。",
                      trap: "⚠️ 防坑卫士：做题第一步必须检查‘是否为直角三角形’！如果题目没有明确给出直角条件，切记不可强行套用！应分情况分类讨论两个边互为直角边的可能。",
                      badge: "几何绝对核心"
                    },
                    {
                      name: "一元二次方程根的判别式与求根公式 ⚛️",
                      formula: "x = [-b ± √(b² - 4ac)] / 2a",
                      desc: "二次方程 ax² + bx + c = 0 (a≠0) 得出精确根的统一公式。判别式为 Δ = b² - 4ac。若 Δ < 0，在实数集内无实根。",
                      trap: "⚠️ 容易手抖：1. 容易忘记首要的前提性质 a ≠ 0；2. 在求根公式中，分母很容易错写成单独的 a，或者符号 -b 错抄成 +b，导致满盘皆输。",
                      badge: "中考必考"
                    },
                    {
                      name: "反比例函数与一次函数面积特征 📈",
                      formula: "S矩形 = |k|  => 与坐标轴围成面积恒等",
                      desc: "双曲线上任意一点 P(x, y) 向两坐标轴作垂线，所围成的直角矩形面积恒等于比例系数的绝对值 |k|。该特殊量常在解析几何与动点结合时作为突破点。",
                      trap: "⚠️ 踩雷提醒：求面积时一定要加上绝对值符号！当双曲线分布在第二、四象限时 k 是负数，但面积数值是正数，需变号写下正值。",
                      badge: "代数压轴常客"
                    }
                  ],
                  english: [
                    {
                      name: "现在完成时态核心句型语感 🔠",
                      formula: "have / has + done (过去分词)",
                      desc: "表示过去发生的动作直到现在刚刚结束，或对现在产生了现实影响。经常和 since (自某时间点起) 或 for (持续某段时间间隔) 组合。",
                      trap: "⚠️ 易错大坑：非延续性动作（如 join, borrow, buy, die, leave）在现在完成时中，【绝对不能】和 for/since 引导的时间段共存！必须把这些短暂动词替换为延续性状态（如 be inside/be a member of, keep, have, be dead, be away）。",
                      badge: "高频纠错点"
                    },
                    {
                      name: "宾语从句时态呼应与语序密码 💬",
                      formula: "主过从过 + 极客陈述语序",
                      desc: "宾语从句三法则：1. 语序永远用陈述代词顺（主语在谓语前）；2. 主句是一般过去时，从句也必须用过去相关的时态；3. 但如果从句表达的是客观真理、常识物理规律，一律坚持‘一般现在时’！",
                      trap: "⚠️ 口语纠偏：千万记得在做句型转换时，手动把助动词 do, does, did 去掉，让疑问句变回老老实实的陈述顺序！例如：一律说 Do you know what his name is? 而非 on his name is it.",
                      badge: "中考压轴选择"
                    },
                    {
                      name: "定语从句关系代词 who/which/that 正确遴选 🎗️",
                      formula: "介词提前后接 which/whom | 严禁 which 变 that",
                      desc: "定语从句先行词指物用 which/that，指人用 who/whom/that。但当介词直接置于关系代词前时（如 in which, with whom），指物只用 which，指人只用 whom，严禁写 that！",
                      trap: "⚠️ 闪电提分：记住只能用 that 的情况：1. 先行词前有 only, any, last, maximum, much, little 修饰时；2. 先行词既有人又有物时。此时切不可用 which 混淆词义。",
                      badge: "高级句法"
                    }
                  ],
                  physics: [
                    {
                      name: "固体压强计算与受力面积判定 ⛵",
                      formula: "p = F / S",
                      desc: "固体压强等于垂直压力与接触受力面积之比。压力大小由直接垂直接触力的强弱决定，并不是所有竖直压下的情况均等于重力物质量。",
                      trap: "⚠️ 错题黑洞：受力面积 S 指的是【两个物体发生挤压的实际公共部分面积】！例如一个面积为 1m² 的大箱子放在 0.1m² 的小凳上，受力面积 S 只能取 0.1m²（凳子面积），而非大箱子总底面积！别忘了换算成国际单位 m²。",
                      badge: "压轴大关"
                    },
                    {
                      name: "阿基米德浮力动态排开体积解析 🌊",
                      formula: "F浮 = ρ液 · g · V排",
                      desc: "物体所受静浮力大小，等同于它排开流体介质的受力重力。V排是由于物体塞入，导致液面真正上涨、浸入浸没于液面之下的局部占体积，并不是物体的几何容积体积。",
                      trap: "⚠️ 概念雷区：区分‘浸入’(V排 < V物，此时漂浮在水面) 与‘浸没’(V排 = V物，此时物体在水下悬浮或沉底)。别把物体的分子或本体密度 ρ物 带入了公式中的 ρ液，那样会导致算出的浮力完全偏向。",
                      badge: "中考大杀器"
                    },
                    {
                      name: "经典欧姆定律与电路断路故障排查 🔌",
                      formula: "I = U / R",
                      desc: "同一条金属并联/串联导体电路中，通过的电流量与该段两端所加电压大小成正比，与其内含电阻成反比。常借助可变滑动变阻器在合理挡位滑移调整定值两端电压。",
                      trap: "⚠️ 家常速判：1. 串联电路特点分压（电阻越大分得电压越大：U1/U2 = R1/R2）；2. 并联电路特点分流（电阻越大分得流越小：I1/I2 = R2/R1）。如果电压表示数接近电源电压数而电流表为零，百分之九十是其并联位置的电器阻值发生了【开路断路】故障！",
                      badge: "电学难点"
                    }
                  ],
                  chemistry: [
                    {
                      name: "溶液中溶质质量百分数运算 🧪",
                      formula: "w = m溶质 / (m溶质 + m溶剂) × 100%",
                      desc: "溶液浓度最主流、最直接的衡量准度。当温度变动、固体饱和度达到极限后，溶质在指定质量的纯水溶剂中将不会继续增加游离。",
                      trap: "⚠️ 避坑大招：若添加的粉末克数超出了该特定温度下的【溶解限定值】，多余出来的那些未能溶解的盐块、杂质沉淀，绝对不能参与到计算公式中的分子、分母运算！只统计真正熔化进去的清液克数。",
                      badge: "中考高频计算"
                    },
                    {
                      name: "复分解反应能发生的底线法则 💥",
                      formula: "AB + CD => AD + CB",
                      desc: "两种电解质化合物在水介质中进行离子自发性调换，属于双向交换。反应前后反应物和合成物的单体化合价绝不发生上浮下跳。",
                      trap: "⚠️ 复分解真传：在产物端，【必须且只能】至少包含有：1. 沉淀（↓ 硫酸钡等不溶晶体）；2. 气体（↑ 二氧化碳等）；3. 弱电解质（即水 H₂O）三者中的某一个，此中考交换法则对决才能真正生效！若不具备三者，混合溶液各离子只是共存，无化学变化发生。",
                      badge: "初中化学中枢"
                    },
                    {
                      name: "经典酸碱盐溶解性状态排查口诀 🧫",
                      formula: "硝酸盐类皆可溶 | 盐酸不溶氯化银",
                      desc: "中考常考难溶杂质分离或无色混浊液离子鉴别。快速了解什么酸可以和什么金属/碱反应放出白色烟沫。",
                      trap: "⚠️ 重点铭记：硫酸钡(BaSO₄) 和 氯化银(AgCl) 是溶解性表中的‘绝绝子二人组’，它们既不溶解于温水，也【不与任何强酸（如稀硝酸）发生消解反应】。在推断题中，如果加入稀硝酸依然保留大团白色沉淀，必定由它们构成！",
                      badge: "必背大表"
                    }
                  ],
                  biology: [
                    {
                      name: "光合作用与呼吸作用的日夜天平 🧬",
                      formula: "光照期积累有机物 | 歇光期纯呼吸消耗",
                      desc: "光合在叶绿体中靠可见光发生（吸收二氧化碳、水分合成植物干粉养料，吐出纯氧）；呼吸在线粒体中持续提供支撑性能量。两者处于相反却相互贯通的质能循环链中。",
                      trap: "⚠️ 科学核心误区：千万别以为‘植物白天只光合、不呼吸’！【植物一秒钟也不能中断呼吸作用】，否则它当场就会死亡。而光合则全看光照充足与否。白天植物的净吸收二氧化碳和有机物重，是两类生化能效叠加抵消后的余额。",
                      badge: "必考重磅常识"
                    },
                    {
                      name: "显微镜成像对角翻转逻辑 🔬",
                      formula: "中心对称旋转 180 度",
                      desc: "目镜和物镜组合折射出的光影，是实物的‘上下颠倒、左右对置’的三维反方向投影。玻片的轻微偏移会使镜头里的焦点产生一模一样的反移。",
                      trap: "⚠️ 实验考证：如果镜筒视野中的红色生物偏在‘左上方’，而你希望把它调整回到镜片大正中，你应该将下方的载玻片朝着【左上方】继续推动，而决不可往相反方向拽！请严格认准物理守恒口诀：‘物朝哪偏，玻朝哪推’！",
                      badge: "微观实操"
                    },
                    {
                      name: "生态系统营养及食物链画法 🌾",
                      formula: "生产者 ──> 第一捕食 ──> 第二捕食",
                      desc: "展现生态圈内部由吃和被吃串造成的能流物质链条。起点必定是自主光合的绿色‘生产者’，到最高统治捕食者终结。",
                      trap: "⚠️ 纸面致命失分：1. 食物链里【永远不要】画上非生物成分（如阳光、死叶、石头、水滴等环境成分），也【万万不可】包含细菌真菌等分解者成分！2. 箭头的朝向必须是由‘被捕食盘中餐’指向‘捕食享用人’，因为是指示营养物流的去向！",
                      badge: "生态大题"
                    }
                  ]
                };

                const currentSubjectDeck = cheatSheetData[cheatSheetSubject] || [];
                return currentSubjectDeck.map((item, idx) => {
                  const itemKey = `${cheatSheetSubject}_${idx}`;
                  const isOpen = showFormulaTip === itemKey;
                  return (
                    <div
                      key={idx}
                      className={`border rounded-2xl p-4 transition-all duration-300 relative overflow-hidden ${
                        isOpen 
                          ? "bg-slate-950/90 border-indigo-500/30 shadow-indigo-500/5 shadow-xl" 
                          : "bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10 cursor-pointer"
                      }`}
                      onClick={() => setShowFormulaTip(isOpen ? null : itemKey)}
                    >
                      {/* Top banner / Badge */}
                      <div className="flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0 shadow-pulse" />
                          <h4 className="text-[13px] md:text-sm font-extrabold text-slate-100 truncate">
                            {item.name}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.badge && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-indigo-500/15 border border-indigo-400/20 text-indigo-300 rounded font-bold">
                              {item.badge}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-bold font-mono">
                            {isOpen ? "收起 ▲" : "展开 ▼"}
                          </span>
                        </div>
                      </div>

                      {/* Summary formula placeholder */}
                      <div className="mt-2 flex items-center justify-between gap-4 bg-slate-950/50 border border-white/5 rounded-xl px-3 py-1.5">
                        <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                          ⚙️ 核心解密核心公式
                        </span>
                        <span className="font-mono text-xs text-amber-300 font-extrabold tracking-tight text-right break-words select-text">
                          {item.formula}
                        </span>
                      </div>

                      {/* Expanded deep explanations */}
                      {isOpen && (
                        <div 
                          className="mt-3 pt-3 border-t border-white/10 space-y-3 animate-fade-in text-left select-text"
                          onClick={(e) => e.stopPropagation()} // Prevent bubble to let students select text
                        >
                          <div className="space-y-1">
                            <span className="text-[10px] font-black tracking-widest text-[#a5b4fc] uppercase block">
                              📚 常温原理 / 考法提炼
                            </span>
                            <p className="text-xs text-slate-200 leading-relaxed">
                              {item.desc}
                            </p>
                          </div>
                          
                          <div className="bg-red-950/30 border border-red-500/15 rounded-xl p-3 space-y-1">
                            <span className="text-[10px] font-black tracking-widest text-red-300 uppercase block">
                              ⚡ 中考避开雷区 & 提分对策
                            </span>
                            <p className="text-xs text-slate-300 leading-relaxed font-medium">
                              {item.trap}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
