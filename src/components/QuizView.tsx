import { useState, FormEvent } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Sparkles, 
  BookOpen, 
  ChevronRight, 
  MessageCircle, 
  User, 
  ArrowLeft, 
  Lightbulb,
  Compass,
  CornerDownRight,
  RefreshCw,
  Award
} from "lucide-react";
import { QuizData, QuizQuestion, QuizFillBlank } from "../types";

interface QuizViewProps {
  quizData: QuizData;
  videoTitle: string;
  onFinishQuiz: (score: number, answers: { [key: number]: number }, correctCount: number) => void;
  onBack: () => void;
}

export default function QuizView({ quizData, videoTitle, onFinishQuiz, onBack }: QuizViewProps) {
  const choiceLength = quizData.questions.length;
  const fillBlanks = quizData.fillBlanks || [];
  const fillBlankLength = fillBlanks.length;
  const totalLength = choiceLength + fillBlankLength;

  const [currentIdx, setCurrentIdx] = useState(0);
  
  // Choice state: questionId -> selectedOption index
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  // Fill-in-the-blank state: blankId -> typed text
  const [typedAnswers, setTypedAnswers] = useState<{ [key: number]: string }>({});
  
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  
  // AI teacher consultation states
  const [consulting, setConsulting] = useState<boolean>(false);
  const [childQuery, setChildQuery] = useState("");
  
  // AI answer states mapped by index/id
  const [aiAnswers, setAiAnswers] = useState<{ [qKey: string]: string }>({});
  const [consultError, setConsultError] = useState<string | null>(null);

  const isFillBlankMode = currentIdx >= choiceLength;
  const currentChoice = !isFillBlankMode ? quizData.questions[currentIdx] : null;
  const currentBlank = isFillBlankMode ? fillBlanks[currentIdx - choiceLength] : null;

  const isLastQuestion = currentIdx === totalLength - 1;

  const handleSelectOption = (optIdx: number) => {
    if (submitted || !currentChoice) return;
    setSelectedAnswers(prev => ({ ...prev, [currentChoice.id]: optIdx }));
  };

  const checkFillBlankCorrect = (blank: QuizFillBlank) => {
    const userInput = (typedAnswers[blank.id] || "").trim().toLowerCase();
    const correctVal = blank.correctAnswer.trim().toLowerCase();
    if (!userInput) return false;
    // Allow smart matching (identity, subset check, e.g. "重力" matches "重力")
    return userInput === correctVal || userInput.includes(correctVal) || correctVal.includes(userInput);
  };

  const handleNext = () => {
    setConsultError(null);
    if (isLastQuestion) {
      // Calculate final score combined across both phases
      let correctCount = 0;
      
      // 1. Grade choices
      quizData.questions.forEach(q => {
        if (selectedAnswers[q.id] === q.correctAnswer) {
          correctCount++;
        }
      });

      // 2. Grade fillBlanks
      fillBlanks.forEach(fb => {
        if (checkFillBlankCorrect(fb)) {
          correctCount++;
        }
      });

      const finalScore = Math.round((correctCount / totalLength) * 100);
      
      // Compatibility mapping: convert selectedAnswers Choice index mapping to App
      onFinishQuiz(finalScore, selectedAnswers, correctCount);
    } else {
      setCurrentIdx(prev => prev + 1);
      setShowHint(false);
      setSubmitted(false);
    }
  };

  const handleConsultAi = async (e: FormEvent) => {
    e.preventDefault();
    if (!childQuery.trim()) return;

    setConsulting(true);
    setConsultError(null);
    
    const queryKey = isFillBlankMode ? `fb_${currentBlank!.id}` : `c_${currentChoice!.id}`;
    const questionText = isFillBlankMode ? currentBlank!.question : currentChoice!.question;
    const standardExpl = isFillBlankMode ? currentBlank!.explanation : currentChoice!.explanation;
    const selected = isFillBlankMode ? (typedAnswers[currentBlank!.id] || "未作答") : (selectedAnswers[currentChoice!.id] ?? -1);
    const correct = isFillBlankMode ? currentBlank!.correctAnswer : currentChoice!.correctAnswer;

    try {
      const response = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: questionText,
          selectedOption: selected,
          correctOption: correct,
          explanation: standardExpl,
          childQuery: childQuery
        })
      });

      const resJson = await response.json();
      if (resJson.success && resJson.explanationText) {
        setAiAnswers(prev => ({
          ...prev,
          [queryKey]: resJson.explanationText
        }));
        setChildQuery("");
      } else {
        setConsultError(resJson.error || "获取AI名师解析失败，请稍后重试");
      }
    } catch (err: any) {
      console.error(err);
      setConsultError("网络问题，未能联系上AI特级名师。");
    } finally {
      setConsulting(false);
    }
  };

  const renderSimpleMarkdown = (text: string) => {
    if (!text) return null;
    return text.split("\n").map((line, i) => {
      if (line.trim().startsWith("*") || line.trim().startsWith("-")) {
        return (
          <li key={i} className="text-slate-300 text-xs ml-4 list-disc mt-1 font-medium leading-relaxed">
            {line.trim().substring(1).trim()}
          </li>
        );
      }
      
      const boldRegex = /\*\*(.*?)\*\*/g;
      let chunks = [];
      let lastIndex = 0;
      let match;
      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          chunks.push(line.substring(lastIndex, match.index));
        }
        chunks.push(<strong key={match.index} className="text-amber-300 font-bold">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < line.length) {
        chunks.push(line.substring(lastIndex));
      }

      if (line.trim().startsWith("###")) {
        return <h4 key={i} className="text-xs font-bold text-amber-400 mt-3">{line.replace("###", "").trim()}</h4>;
      }

      return (
        <p key={i} className="text-slate-300 text-xs mt-1 leading-relaxed font-normal">
          {chunks.length > 0 ? chunks : line}
        </p>
      );
    });
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case "basic":
        return <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold rounded-full">基础巩固</span>;
      case "intermediate":
        return <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold rounded-full">中考冲刺</span>;
      case "challenging":
        return <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold rounded-full">思维拉伸</span>;
      default:
        return null;
    }
  };

  // Choice phase details
  const hasAnsweredChoice = currentChoice ? selectedAnswers[currentChoice.id] !== undefined : false;
  const isChoiceCorrect = currentChoice ? selectedAnswers[currentChoice.id] === currentChoice.correctAnswer : false;

  // FillBlank phase details
  const currentBlankInput = currentBlank ? (typedAnswers[currentBlank.id] || "") : "";
  const hasAnsweredBlank = currentBlankInput.trim().length > 0;
  const isBlankCorrect = currentBlank ? checkFillBlankCorrect(currentBlank) : false;

  const currentTutorKey = isFillBlankMode ? `fb_${currentBlank?.id}` : `c_${currentChoice?.id}`;
  const currentExplanation = isFillBlankMode ? currentBlank?.explanation : currentChoice?.explanation;

  return (
    <div className="max-w-[1600px] w-full mx-auto px-4 py-4 space-y-6">
      {/* Quiz Top Action Bar */}
      <div className="flex items-center justify-between bg-slate-900/80 backdrop-blur-md px-5 py-4 rounded-3xl border border-white/10 shadow-lg text-white">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          返回影院大厅
        </button>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">正在测评视频</span>
          <span className="text-xs font-extrabold text-slate-100 max-w-sm block truncate">{videoTitle}</span>
        </div>
      </div>

      {/* Progress Card */}
      <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 text-white">
        
        {/* Left Panel: Question presentation (Col: 6) */}
        <div className="md:col-span-6 p-8 space-y-6 border-r border-white/10">
          
          {/* Question Meta Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-blue-600/30 border border-blue-500/40 text-blue-300 font-mono font-black text-[11px] rounded-xl shadow-md">
                第 {currentIdx + 1} 题 / 共 {totalLength} 题
              </span>
              <span className="px-2 py-0.5 bg-indigo-500/15 border border-indigo-400/25 text-[10px] font-black rounded-full text-indigo-300 uppercase tracking-widest">
                {isFillBlankMode ? "✏️ 概念填空" : "📝 单项选择"}
              </span>
              {getDifficultyBadge(isFillBlankMode ? currentBlank!.difficulty : currentChoice!.difficulty)}
            </div>
            <button
              onClick={() => setShowHint(!showHint)}
              className="flex items-center gap-1.5 text-[10px] font-black text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-xl transition-colors cursor-pointer border border-amber-500/20 shadow-sm"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              {showHint ? "收起提示" : "获取解题点拨"}
            </button>
          </div>

          {/* Question text card with distinct styling */}
          <div className="bg-white/5 rounded-2xl p-5 border border-white/10 relative">
            <h3 className="text-sm md:text-base font-extrabold text-slate-100 leading-relaxed select-text">
              {isFillBlankMode ? currentBlank!.question : currentChoice!.question}
            </h3>
          </div>

          {/* Helpful Idea hint drawer */}
          {showHint && (
            <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-4 flex gap-3 animate-fade-in">
              <Compass className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <span className="text-[10px] font-black text-amber-300 uppercase tracking-widest block">AI 专属特级名师思路启发:</span>
                <p className="text-xs text-amber-100 leading-relaxed font-semibold mt-1">
                  {isFillBlankMode ? currentBlank!.hint : currentChoice!.hint}
                </p>
              </div>
            </div>
          )}

          {/* Choice Mode Option Buttons */}
          {!isFillBlankMode ? (
            <div className="space-y-3">
              {currentChoice!.options.map((option, idx) => {
                const letter = String.fromCharCode(65 + idx);
                const isSelected = selectedAnswers[currentChoice.id] === idx;
                const isOptionCorrect = idx === currentChoice.correctAnswer;
                
                let btnStyle = "border-white/10 hover:bg-white/5 text-slate-200 hover:border-slate-500";
                let badgeStyle = "bg-white/10 text-slate-300 group-hover:bg-blue-500/20 group-hover:text-blue-300";
                
                if (isSelected) {
                  if (submitted) {
                    if (isOptionCorrect) {
                      btnStyle = "bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-md";
                      badgeStyle = "bg-emerald-500 text-white";
                    } else {
                      btnStyle = "bg-rose-500/15 border-rose-500/50 text-rose-300 shadow-md";
                      badgeStyle = "bg-rose-500 text-white";
                    }
                  } else {
                    btnStyle = "bg-blue-500/15 border-blue-500/50 text-blue-300 shadow-lg";
                    badgeStyle = "bg-blue-500 text-white shadow";
                  }
                } else if (submitted && isOptionCorrect) {
                  btnStyle = "bg-emerald-500/10 border-emerald-500/30 text-emerald-300";
                  badgeStyle = "bg-emerald-500 text-white";
                }

                return (
                  <button
                    key={idx}
                    id={`opt-${currentChoice.id}-${idx}`}
                    onClick={() => handleSelectOption(idx)}
                    disabled={submitted}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3.5 group relative ${btnStyle}`}
                  >
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 transition-colors ${badgeStyle}`}>
                      {letter}
                    </span>
                    <span className="text-xs md:text-sm font-black leading-snug">{option}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            /* FillBlank Mode Input Form */
            <div className="bg-slate-950/40 p-5 rounded-2xl border border-white/10 space-y-4">
              <label className="text-xs font-black text-indigo-300 block">请输入你的填空题解答内容：</label>
              
              <div className="relative">
                <input
                  type="text"
                  value={currentBlankInput}
                  onChange={(e) => setTypedAnswers(prev => ({ ...prev, [currentBlank!.id]: e.target.value }))}
                  placeholder="在此写下答题词汇或规律符号（例如: 重力 或 4 等）"
                  disabled={submitted}
                  className="w-full p-4 pr-12 bg-white/5 border border-white/10 rounded-2xl focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm font-extrabold"
                />
                
                {submitted && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {isBlankCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-400" />
                    )}
                  </div>
                )}
              </div>

              {submitted && (
                <div className="text-xs bg-indigo-500/5 p-3 rounded-xl border border-indigo-500/10 text-indigo-200 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span>参考标准答案：<strong className="text-white text-sm bg-indigo-500/20 px-2 py-0.5 rounded ml-1">{currentBlank!.correctAnswer}</strong></span>
                </div>
              )}
            </div>
          )}

          {/* Action Row */}
          <div className="flex gap-3 justify-end pt-2">
            {!submitted ? (
              <button
                onClick={() => setSubmitted(true)}
                disabled={isFillBlankMode ? !hasAnsweredBlank : !hasAnsweredChoice}
                className={`px-6 py-3 rounded-xl font-bold text-xs tracking-wider transition-all select-none ${
                  (isFillBlankMode ? hasAnsweredBlank : hasAnsweredChoice)
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white cursor-pointer shadow-lg active:scale-95"
                    : "bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed"
                }`}
              >
                确认解答・提交此题
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-sky-500 text-slate-950 font-black hover:brightness-110 active:scale-[0.98] transition-all rounded-xl text-xs tracking-wider shadow-lg flex items-center gap-1 cursor-pointer"
              >
                {isLastQuestion ? "完成测评并提交试卷 🏆" : "开始下一道题"}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>

        {/* Right Panel: Teacher feedback and AI consultation (Col: 6) */}
        <div className="md:col-span-6 bg-[#0c1322]/85 backdrop-blur-xl p-8 flex flex-col justify-between border-l border-white/10">
          <div className="space-y-6">
            {!submitted ? (
              <div className="text-center py-20 px-4 space-y-4">
                <div className="w-16 h-16 bg-white/5 text-slate-400 rounded-full flex items-center justify-center mx-auto border border-dashed border-white/10">
                  <BookOpen className="w-7 h-7 animate-pulse text-indigo-400" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-100 tracking-wider">智能解析全科黑板</h4>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed max-w-sm mx-auto">
                    只要针对左侧题目确认并点击提交解答，智能黑板报就会为您呈现名师的幽默学科计算、公式演练和记忆通关秘诀！
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-5 animate-fade-in max-h-[600px] overflow-y-auto pr-2 dataset-scrollbar">
                
                <div className="flex items-center gap-1.5 pb-2 border-b border-white/10">
                  {(isFillBlankMode ? isBlankCorrect : isChoiceCorrect) ? (
                    <div className="flex items-center gap-1.5 text-emerald-400 font-extrabold text-xs">
                      <CheckCircle2 className="w-4 h-4 animate-bounce" />
                      太漂亮了！一箭穿心答对
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-rose-400 font-extrabold text-xs">
                      <XCircle className="w-4 h-4 animate-flash" />
                      哎呀，稍微偏了一点点
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">教师粉笔详析:</span>
                  <p className="text-[11px] font-medium leading-relaxed text-slate-200 bg-white/5 p-3 rounded-xl border border-white/10 shadow-inner">
                    {currentExplanation}
                  </p>
                </div>

                {/* AI Interactive Consultation Portal */}
                <div className="pt-2 border-t border-white/10">
                  <div className="flex items-center gap-1 text-sky-300 text-[10px] font-black mb-2 uppercase tracking-wide">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    追问 AI 特级教师：
                  </div>

                  {aiAnswers[currentTutorKey] ? (
                    <div className="bg-blue-950/40 border border-blue-500/20 rounded-2xl p-3.5 text-xs mb-3 space-y-2 text-slate-100">
                      <div className="flex items-center gap-1.5 font-black text-sky-300">
                        <MessageCircle className="w-3.5 h-3.5" />
                        AI 名师黑板报：
                      </div>
                      <div className="space-y-1">
                        {renderSimpleMarkdown(aiAnswers[currentTutorKey])}
                      </div>
                      <button 
                        onClick={() => {
                          setAiAnswers(prev => {
                            const clone = { ...prev };
                            delete clone[currentTutorKey];
                            return clone;
                          });
                        }}
                        className="text-[10px] text-sky-400 hover:text-sky-300 font-black cursor-pointer pt-1 block"
                      >
                        我要追问其他疑问 ↩
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleConsultAi} className="space-y-3">
                      <textarea
                        rows={4}
                        value={childQuery}
                        onChange={(e) => setChildQuery(e.target.value)}
                        placeholder="💡 可以输入您想追问AI名师的问题，例如：
- 老师，能用更有趣的生活场景解释一下这道题吗？
- 还有哪些类似的中考经典考点和防坑大招？
- 这道题有什么秒杀口诀吗？"
                        className="w-full text-xs p-3.5 bg-slate-950/80 border border-white/10 focus:border-indigo-505 rounded-xl focus:outline-none placeholder:text-slate-500 leading-relaxed font-semibold text-white focus:ring-1 focus:ring-indigo-500"
                        disabled={consulting}
                      />
                      
                      {consultError && (
                        <div className="text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2 rounded-lg text-center font-bold">
                          ⚠️ {consultError}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={consulting || !childQuery.trim()}
                        className={`w-full py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-colors ${
                          childQuery.trim() && !consulting
                            ? "bg-sky-500 hover:bg-sky-400 text-slate-950 cursor-pointer shadow-lg active:scale-95"
                            : "bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed"
                        }`}
                      >
                        {consulting ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            名师撰写生动教案中...
                          </>
                        ) : (
                          <>
                            <MessageCircle className="w-3 h-3" />
                            向 AI 发送疑问
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>

              </div>
            )}
          </div>

          <div className="pt-4 border-t border-white/10 text-center text-[10px] text-slate-400 font-extrabold tracking-wide uppercase">
            玩转初中物理与全科，AI 老师陪你起飞 🚀
          </div>
        </div>

      </div>
    </div>
  );
}
