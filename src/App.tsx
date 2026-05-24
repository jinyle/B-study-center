import { useState, useEffect } from "react";
import { 
  Tv, 
  Settings, 
  Calculator, 
  Activity, 
  Award, 
  Compass, 
  RefreshCw,
  Sparkles,
  BookmarkCheck,
  CheckCircle,
  HelpCircle
} from "lucide-react";
import { PRESET_VIDEOS, PRESET_MEDALS } from "./data";
import { BiliVideo, StudyRecord, Medal } from "./types";
import ChildDashboard from "./components/ChildDashboard";
import ParentDashboard from "./components/ParentDashboard";
import QuizView from "./components/QuizView";
import FormulaHelper from "./components/FormulaHelper";

export default function App() {
  // Profiles: 'student' (learning + achievements) or 'parent' (validate, statistics, setup)
  const [profile, setProfile] = useState<"student" | "parent">("student");
  
  // Navigation tabs for student profile
  const [studentTab, setStudentTab] = useState<"cinema" | "sandbox">("cinema");

  // Local State database loaded from localStorage
  const [videos, setVideos] = useState<BiliVideo[]>([]);
  const [records, setRecords] = useState<StudyRecord[]>([]);
  const [medals, setMedals] = useState<Medal[]>([]);
  const [usedFormulaCalculator, setUsedFormulaCalculator] = useState<boolean>(false);

  // Active testing session video
  const [activeQuizVideo, setActiveQuizVideo] = useState<BiliVideo | null>(null);

  // Active Score Report card overlay state
  const [scoreReport, setScoreReport] = useState<{
    videoTitle: string;
    score: number;
    correctCount: number;
    totalCount: number;
  } | null>(null);

  // Pending custom confirmations
  const [pendingDeleteVideoId, setPendingDeleteVideoId] = useState<string | null>(null);
  const [pendingClearHistory, setPendingClearHistory] = useState<boolean>(false);

  // Init data from localStorage or presets
  useEffect(() => {
    // 1. Videos
    const savedVideos = localStorage.getItem("bili_physics_videos");
    if (savedVideos) {
      try {
        const parsed = JSON.parse(savedVideos) as BiliVideo[];
        // Upgrade stored videos so they copy any new preset fields like readingMaterial
        const upgraded = parsed.map(v => {
          const preset = PRESET_VIDEOS.find(p => 
            (p.bvid && v.bvid && p.bvid.toLowerCase() === v.bvid.toLowerCase()) || 
            String(p.id) === String(v.id)
          );
          if (preset) {
            return {
              ...v,
              readingMaterial: v.readingMaterial || preset.readingMaterial,
              quizData: v.quizData || preset.quizData
            };
          }
          return v;
        });
        setVideos(upgraded);
        localStorage.setItem("bili_physics_videos", JSON.stringify(upgraded));
      } catch (err) {
        setVideos(PRESET_VIDEOS);
      }
    } else {
      setVideos(PRESET_VIDEOS);
      localStorage.setItem("bili_physics_videos", JSON.stringify(PRESET_VIDEOS));
    }

    // 2. Records
    const savedRecords = localStorage.getItem("bili_physics_records");
    if (savedRecords) {
      try {
        setRecords(JSON.parse(savedRecords));
      } catch (err) {
        setRecords([]);
      }
    }

    // 3. Formula calculator usage
    const savedFormulaFlag = localStorage.getItem("bili_formula_calculator_used");
    if (savedFormulaFlag) {
      setUsedFormulaCalculator(savedFormulaFlag === "true");
    }

    // 4. Medals
    const savedMedals = localStorage.getItem("bili_physics_medals");
    if (savedMedals) {
      try {
        setMedals(JSON.parse(savedMedals));
      } catch (err) {
        setMedals(PRESET_MEDALS);
      }
    } else {
      setMedals(PRESET_MEDALS);
      localStorage.setItem("bili_physics_medals", JSON.stringify(PRESET_MEDALS));
    }
  }, []);

  // Sync state modifications alongside automatic Achievement validation algorithms!
  const runAchievementCheck = (
    currentVideos: BiliVideo[],
    currentRecords: StudyRecord[],
    currentCalculatorFlag: boolean
  ) => {
    const updatedMedals = PRESET_MEDALS.map(m => {
      let isUnlocked = false;

      switch (m.id) {
        case "first_perfect":
          // Got 100 on any test
          isUnlocked = currentRecords.some(r => r.score === 100);
          break;
        case "science_explorer":
          // Added at least 1 course (Videos total of 4 or more)
          isUnlocked = currentVideos.length >= 4;
          break;
        case "persistent_student":
          // Completed 5 or more test attempts
          isUnlocked = currentRecords.length >= 5;
          break;
        case "mechanic_master":
          // Finished a mechanics video test
          isUnlocked = currentRecords.some(r => {
            const matchVid = currentVideos.find(v => v.id === r.videoId);
            return matchVid && matchVid.category === "mechanics";
          });
          break;
        case "ohm_conqueror":
          // Scored 80+ on Electromagnetics
          isUnlocked = currentRecords.some(r => {
            const matchVid = currentVideos.find(v => v.id === r.videoId);
            return matchVid && matchVid.category === "electromagnetics" && r.score >= 80;
          });
          break;
        case "formula_wizard":
          // Triggered the math helper simulator
          isUnlocked = currentCalculatorFlag;
          break;
        default:
          isUnlocked = false;
      }

      return {
        ...m,
        unlockedAt: isUnlocked ? (m.unlockedAt || new Date().toISOString()) : undefined
      };
    });

    setMedals(updatedMedals);
    localStorage.setItem("bili_physics_medals", JSON.stringify(updatedMedals));
  };

  // Add video trigger from parent form
  const handleAddVideo = (newVideo: BiliVideo) => {
    const nextVids = [newVideo, ...videos];
    setVideos(nextVids);
    localStorage.setItem("bili_physics_videos", JSON.stringify(nextVids));
    runAchievementCheck(nextVids, records, usedFormulaCalculator);
  };

  // Update video details on-the-fly (e.g. when spawning a subpart quiz inside child mode)
  const handleUpdateVideo = (updatedVideo: BiliVideo) => {
    const nextVids = videos.map(v => v.id === updatedVideo.id ? updatedVideo : v);
    setVideos(nextVids);
    localStorage.setItem("bili_physics_videos", JSON.stringify(nextVids));
  };

  // Delete video trigger
  const handleDeleteVideo = (id: string) => {
    setPendingDeleteVideoId(id);
  };

  const confirmDeleteVideo = () => {
    if (!pendingDeleteVideoId) return;
    const id = pendingDeleteVideoId;
    const nextVids = videos.filter(v => v.id !== id);
    setVideos(nextVids);
    localStorage.setItem("bili_physics_videos", JSON.stringify(nextVids));

    const nextRecs = records.filter(r => r.videoId !== id);
    setRecords(nextRecs);
    localStorage.setItem("bili_physics_records", JSON.stringify(nextRecs));

    runAchievementCheck(nextVids, nextRecs, usedFormulaCalculator);
    setPendingDeleteVideoId(null);
  };

  // Clear historic reports
  const handleClearHistory = () => {
    setPendingClearHistory(true);
  };

  const confirmClearHistory = () => {
    const nextRecs: StudyRecord[] = [];
    setRecords(nextRecs);
    localStorage.setItem("bili_physics_records", JSON.stringify(nextRecs));
    runAchievementCheck(videos, nextRecs, usedFormulaCalculator);
    setPendingClearHistory(false);
  };

  // Activate formula tool flag
  const triggerFormulaUsage = () => {
    if (!usedFormulaCalculator) {
      setUsedFormulaCalculator(true);
      localStorage.setItem("bili_formula_calculator_used", "true");
      runAchievementCheck(videos, records, true);
    }
  };

  // Submission callback from QuizView testing mode
  const handleFinishQuiz = (score: number, answers: { [key: number]: number }, correctCount: number) => {
    if (!activeQuizVideo) return;

    const newRecord: StudyRecord = {
      id: Date.now().toString(),
      videoId: activeQuizVideo.id,
      videoTitle: activeQuizVideo.title,
      score,
      totalQuestions: activeQuizVideo.quizData?.questions.length || 0,
      correctCount,
      completedAt: new Date().toISOString(),
      answers
    };

    const nextRecs = [newRecord, ...records];
    setRecords(nextRecs);
    localStorage.setItem("bili_physics_records", JSON.stringify(nextRecs));

    // Show final decorative report overlay
    setScoreReport({
      videoTitle: activeQuizVideo.title,
      score,
      correctCount,
      totalCount: newRecord.totalQuestions
    });

    // Run badge triggers
    runAchievementCheck(videos, nextRecs, usedFormulaCalculator);
    // Dismiss video test session
    setActiveQuizVideo(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans relative overflow-x-hidden">
      
      {/* Mesh Gradient Background Elements */}
      <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[80px] pointer-events-none" />

      {/* GLOBAL HIGH-CONTRAST MAIN APPLICATION HEADER CONTAINER */}
      <header className="relative z-10 border-b border-white/10 backdrop-blur-md bg-white/5 sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Decorative Logo / Brand block */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg">
              <span className="font-bold text-lg">💡</span>
            </div>
            <div>
              <span className="text-sm font-black text-slate-100 tracking-tight flex items-center gap-1.5">
                BiliStudy 智能全科AI学习与测评助手
                <Compass className="w-3.5 h-3.5 text-blue-400" />
              </span>
              <span className="text-[10px] text-slate-350 font-bold block mt-0.5">面向中小学的全科视频自主伴学端 <span className="text-xs font-normal opacity-70 px-2 py-0.5 rounded-full border border-white/20 ml-2">全科融合版</span></span>
            </div>
          </div>

          {/* Dual profile Switch Terminal with High Contrast labels */}
          <div className="flex items-center gap-4">
            
            {/* Nav Switch Menu (Only shown when not inside an active quiz assessment session) */}
            {!activeQuizVideo && (
              <div className="flex items-center gap-1.5 bg-slate-900/50 p-1 rounded-xl border border-white/10">
                <button
                  id="tab-student"
                  onClick={() => {
                    setProfile("student");
                    setStudentTab("cinema");
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    profile === "student"
                      ? "bg-white/15 text-white border border-white/15 shadow-sm backdrop-blur-md"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Tv className="w-3.5 h-3.5" />
                  学生学习中心
                </button>
                <button
                  id="tab-parent"
                  onClick={() => setProfile("parent")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    profile === "parent"
                      ? "bg-white/15 text-white border border-white/15 shadow-sm backdrop-blur-md"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  家长控制台
                </button>
              </div>
            )}

            {/* Simulated Avatar user indicators info */}
            <div className="hidden md:flex items-center gap-2 border-l border-white/10 pl-4 text-xs font-medium text-slate-300">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
              <span>伴学空间：jinyledai 的探客空间</span>
            </div>
          </div>

        </div>
      </header>

      {/* RENDER DYNAMIC NAVIGATION UNDER-BAR SPECIFICALLY FOR ACTIONS IN STUDENT MODE */}
      {profile === "student" && !activeQuizVideo && (
        <div className="relative z-10 border-b border-white/10 backdrop-blur-md bg-white/5">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex gap-6">
            <button
              id="subtab-cinema"
              onClick={() => setStudentTab("cinema")}
              className={`py-3 text-xs font-extrabold cursor-pointer border-b-2 transition-all flex items-center gap-1.5 ${
                studentTab === "cinema"
                  ? "border-blue-400 text-blue-300 font-bold"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Tv className="w-4 h-4" />
              双桅全科影院小剧场
            </button>
            <button
              id="subtab-sandbox"
              onClick={() => {
                setStudentTab("sandbox");
                triggerFormulaUsage();
              }}
              className={`py-3 text-xs font-extrabold cursor-pointer border-b-2 transition-all flex items-center gap-1.5 ${
                studentTab === "sandbox"
                  ? "border-blue-400 text-blue-300 font-bold"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Calculator className="w-4 h-4" />
              全科数理实验沙盒
            </button>
          </div>
        </div>
      )}

      {/* CORE WRAPPED BODY VIEWPORT */}
      <main className="relative z-10 flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* VIEW 1: Active testing session take questionnaire */}
        {activeQuizVideo && activeQuizVideo.quizData ? (
          <QuizView
            quizData={activeQuizVideo.quizData}
            videoTitle={activeQuizVideo.title}
            onFinishQuiz={handleFinishQuiz}
            onBack={() => setActiveQuizVideo(null)}
          />
        ) : (
          /* VIEW 2: Dashboard toggler */
          <>
            {profile === "student" ? (
              studentTab === "cinema" ? (
                <ChildDashboard
                  videos={videos}
                  medals={medals}
                  records={records}
                  onStartQuiz={(video) => setActiveQuizVideo(video)}
                  onOpenFormulaBox={() => {
                    setStudentTab("sandbox");
                    triggerFormulaUsage();
                  }}
                  onUpdateVideo={handleUpdateVideo}
                />
              ) : (
                <div className="space-y-6">
                  <div className="max-w-4xl mx-auto">
                    <button
                      onClick={() => setStudentTab("cinema")}
                      className="text-xs text-blue-400 hover:text-blue-300 font-bold hover:underline mb-4 cursor-pointer block"
                    >
                      ← 返回视频影院大厅
                    </button>
                  </div>
                  <FormulaHelper />
                </div>
              )
            ) : (
              <ParentDashboard
                videos={videos}
                records={records}
                medals={medals}
                onAddVideo={handleAddVideo}
                onDeleteVideo={handleDeleteVideo}
                onClearHistory={handleClearHistory}
              />
            )}
          </>
        )}

      </main>

      {/* CONFIRM DELETE VIDEO MODAL */}
      {pendingDeleteVideoId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 text-white rounded-3xl max-w-sm w-full p-6 text-center space-y-5 shadow-2xl relative overflow-hidden animate-fade-in animate-scale-up">
            <h3 className="font-extrabold text-white text-base text-center">下架并删除此分集课程大纲？</h3>
            <p className="text-xs text-slate-350 leading-relaxed text-center">
              确定要下架并删除此课程大纲吗？这也会一并移除与该视频关联的所有测评和答题错题记录噢！
            </p>
            <div className="flex gap-3 pt-2">
              <button
                id="modal-cancel-delete"
                onClick={() => setPendingDeleteVideoId(null)}
                className="flex-1 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer text-center"
              >
                取消
              </button>
              <button
                id="modal-confirm-delete"
                onClick={confirmDeleteVideo}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer text-center shadow-lg"
              >
                确定删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM CLEAR HISTORY MODAL */}
      {pendingClearHistory && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 text-white rounded-3xl max-w-sm w-full p-6 text-center space-y-5 shadow-2xl relative overflow-hidden animate-fade-in animate-scale-up">
            <h3 className="font-extrabold text-white text-base text-center">确定要清空测评记录吗？</h3>
            <p className="text-xs text-slate-350 leading-relaxed text-center">
              确定要彻底清空所有的答题测评记录吗？这可能会重置某些依赖该成绩的荣誉勋章。
            </p>
            <div className="flex gap-3 pt-2">
              <button
                id="modal-cancel-clear"
                onClick={() => setPendingClearHistory(false)}
                className="flex-1 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer text-center"
              >
                取消
              </button>
              <button
                id="modal-confirm-clear"
                onClick={confirmClearHistory}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer text-center shadow-lg"
              >
                确定清空
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP OVERLAY REPORT: Student congratulations score page */}
      {scoreReport && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 text-white rounded-3xl max-w-md w-full p-6 text-center space-y-5 shadow-2xl relative overflow-hidden animate-fade-in animate-scale-up">
            
            {/* Visual sparkle graphic background */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500 opacity-20 blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500 opacity-20 blur-2xl pointer-events-none" />

            <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
              <Award className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                测评圆满完成！
              </span>
              <h3 className="font-extrabold text-white text-sm max-w-xs mx-auto truncate mt-1">
                《{scoreReport.videoTitle}》
              </h3>
            </div>

            {/* Giant score badge */}
            <div className="py-4">
              <div className="text-5xl font-extrabold font-mono text-white">
                {scoreReport.score} <span className="text-sm font-sans font-semibold text-slate-350">分</span>
              </div>
              <p className="text-xs font-semibold text-slate-300 mt-1">
                恭喜！你答对了 {scoreReport.correctCount} / {scoreReport.totalCount} 道题目！
              </p>
            </div>

            {/* Performance descriptive text card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-slate-200 leading-relaxed font-semibold">
              {scoreReport.score === 100 ? (
                <span className="text-amber-300 flex items-center gap-1.5 justify-center">
                  <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                  完美的学科才华！你解锁了【满分学神】荣誉勋章！加油，未来的学者！
                </span>
              ) : scoreReport.score >= 80 ? (
                <span className="text-emerald-300">
                  非常优秀！答错的题目已经配有详细解答。全学科大师之路由此起航，继续加油！
                </span>
              ) : (
                <span className="text-slate-300">
                  很棒的尝试！考点或公式有迷惑项是很正常的，不妨根据“AI特级名师”解答重新学习一遍。
                </span>
              )}
            </div>

            <button
              id="report-close-btn"
              onClick={() => setScoreReport(null)}
              className="w-full cursor-pointer py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl tracking-wider transition-colors shadow-lg"
            >
              收下成绩，回大厅继续学习
            </button>

          </div>
        </div>
      )}

      {/* Standard visual humble footer */}
      <footer className="relative z-10 border-t border-white/5 backdrop-blur-md bg-slate-900/80 py-4 text-center text-[10px] text-slate-400 uppercase tracking-widest mt-auto">
        <div className="max-w-[1600px] mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>Session: BiliStudy_K12_FullSubject | AI Engine: Learning-Pulse-v3</span>
          <span>BiliStudy 智能全科AI学习与测评助手 | Designed for Student Learning Excellence ⚓</span>
        </div>
      </footer>
    </div>
  );
}
