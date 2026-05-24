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
  RefreshCw
} from "lucide-react";
import { QuizData, QuizQuestion } from "../types";

interface QuizViewProps {
  quizData: QuizData;
  videoTitle: string;
  onFinishQuiz: (score: number, answers: { [key: number]: number }, correctCount: number) => void;
  onBack: () => void;
}

export default function QuizView({ quizData, videoTitle, onFinishQuiz, onBack }: QuizViewProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  
  // AI teacher consultation states
  const [consulting, setConsulting] = useState<boolean>(false);
  const [childQuery, setChildQuery] = useState("");
  const [aiAnswers, setAiAnswers] = useState<{ [qId: number]: string }>({});
  const [consultError, setConsultError] = useState<string | null>(null);

  const currentQuestion = quizData.questions[currentIdx];
  const isLastQuestion = currentIdx === quizData.questions.length - 1;

  const handleSelectOption = (optIdx: number) => {
    if (submitted) return; // Cannot modify after submitting this question
    setSelectedAnswers(prev => ({ ...prev, [currentQuestion.id]: optIdx }));
  };

  const handleNext = () => {
    setConsultError(null);
    if (isLastQuestion) {
      // Calculate final score
      let correctCount = 0;
      quizData.questions.forEach(q => {
        if (selectedAnswers[q.id] === q.correctAnswer) {
          correctCount++;
        }
      });
      const finalScore = Math.round((correctCount / quizData.questions.length) * 100);
      onFinishQuiz(finalScore, selectedAnswers, correctCount);
    } else {
      setCurrentIdx(prev => prev + 1);
      setShowHint(false);
      setSubmitted(false);
    }
  };

  // Connect to server-side Gemini endpoint to get custom physics explain response
  const handleConsultAi = async (e: FormEvent) => {
    e.preventDefault();
    if (!childQuery.trim()) return;

    setConsulting(true);
    setConsultError(null);
    try {
      const response = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentQuestion.question,
          selectedOption: selectedAnswers[currentQuestion.id] ?? -1,
          correctOption: currentQuestion.correctAnswer,
          explanation: currentQuestion.explanation,
          childQuery: childQuery
        })
      });

      const resJson = await response.json();
      if (resJson.success && resJson.explanationText) {
        setAiAnswers(prev => ({
          ...prev,
          [currentQuestion.id]: resJson.explanationText
        }));
        setChildQuery("");
      } else {
        setConsultError(resJson.error || "获取AI名师解析失败，请捎后重试");
      }
    } catch (err: any) {
      console.error(err);
      setConsultError("网络问题，未能联系上AI特级名师。");
    } finally {
      setConsulting(false);
    }
  };

  // Convert raw Markdown text to beautiful HTML-styled structure simply so we don't have peer dependency errors in React 19
  const renderSimpleMarkdown = (text: string) => {
    if (!text) return null;
    return text.split("\n").map((line, i) => {
      // Bullets
      if (line.trim().startsWith("*") || line.trim().startsWith("-")) {
        return (
          <li key={i} className="text-slate-600 text-sm ml-4 list-disc mt-1 font-medium leading-relaxed">
            {line.trim().substring(1).trim()}
          </li>
        );
      }
      // Bold items
      const boldRegex = /\*\*(.*?)\*\*/g;
      let chunks = [];
      let lastIndex = 0;
      let match;
      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          chunks.push(line.substring(lastIndex, match.index));
        }
        chunks.push(<strong key={match.index} className="text-blue-700 font-bold">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < line.length) {
        chunks.push(line.substring(lastIndex));
      }

      // Headers like ###
      if (line.trim().startsWith("###")) {
        return <h4 key={i} className="text-sm font-bold text-blue-950 mt-3">{line.replace("###", "").trim()}</h4>;
      }

      return (
        <p key={i} className="text-slate-600 text-sm mt-1.5 leading-relaxed font-normal">
          {chunks.length > 0 ? chunks : line}
        </p>
      );
    });
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case "basic":
        return <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[11px] font-bold rounded-full">基础稳固</span>;
      case "intermediate":
        return <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 text-[11px] font-bold rounded-full">中考进阶</span>;
      case "challenging":
        return <span className="px-2.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 text-[11px] font-bold rounded-full">思维拓展</span>;
      default:
        return null;
    }
  };

  const hasAnsweredCurrent = selectedAnswers[currentQuestion.id] !== undefined;
  const isCorrect = selectedAnswers[currentQuestion.id] === currentQuestion.correctAnswer;

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-6">
      {/* Quiz Top Action Bar */}
      <div className="flex items-center justify-between bg-white/5 backdrop-blur-md px-5 py-4 rounded-2xl border border-white/10 shadow-lg text-white">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-300 hover:text-white text-sm font-medium transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          返回学习大厅
        </button>
        <div className="text-right">
          <span className="text-xs text-slate-400 font-medium block">正在答题的课程</span>
          <span className="text-sm font-bold text-slate-100 max-w-sm block truncate">{videoTitle}</span>
        </div>
      </div>

      {/* Progress Card */}
      <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12">
        
        {/* Left Interactive panel: Questions & Answers (Col: 8) */}
        <div className="md:col-span-8 p-6 space-y-6 border-r border-white/10">
          
          {/* Question Meta Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-blue-600 text-white font-mono font-black text-sm rounded-xl shadow-md">
                Q {currentQuestion.id} / {quizData.questions.length}
              </span>
              {getDifficultyBadge(currentQuestion.difficulty)}
            </div>
            <button
              id="hint-btn"
              onClick={() => setShowHint(!showHint)}
              className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-amber-500/20"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              {showHint ? "隐藏思路启发" : "点击启发思路"}
            </button>
          </div>

          {/* Question Text */}
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <h3 className="text-base font-semibold text-slate-100 leading-relaxed">
              {currentQuestion.question}
            </h3>
          </div>

          {/* Interactive Hint panel */}
          {showHint && (
            <div className="bg-amber-950/40 border border-amber-500/20 rounded-2xl p-4 flex gap-3 animate-fade-in">
              <Compass className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">学科小探客思路启发:</span>
                <p className="text-xs text-amber-200/90 leading-relaxed font-medium mt-1">{currentQuestion.hint}</p>
              </div>
            </div>
          )}

          {/* Options Grid */}
          <div className="space-y-2.5">
            {currentQuestion.options.map((option, idx) => {
              const letter = String.fromCharCode(65 + idx); // A, B, C, D
              const isSelected = selectedAnswers[currentQuestion.id] === idx;
              const isOptionCorrect = idx === currentQuestion.correctAnswer;
              
              let btnClass = "border-white/10 hover:bg-white/5 text-slate-200";
              let letterBackground = "bg-white/10 text-slate-300 group-hover:bg-blue-500/30 group-hover:text-blue-200 border border-white/15";
              
              if (isSelected) {
                // If submitted, show correct vs incorrect
                if (submitted) {
                  if (isOptionCorrect) {
                    btnClass = "bg-emerald-950/40 border-emerald-500/40 text-emerald-200";
                    letterBackground = "bg-emerald-500 text-white";
                  } else {
                    btnClass = "bg-rose-950/40 border-rose-500/40 text-rose-200";
                    letterBackground = "bg-rose-500 text-white";
                  }
                } else {
                  // Not submitted yet, just highlighted
                  btnClass = "bg-blue-500/20 border-blue-500/40 text-blue-200 shadow-lg";
                  letterBackground = "bg-blue-500 text-white";
                }
              } else if (submitted && isOptionCorrect) {
                // Highlight correct answer if they picked wrong
                btnClass = "bg-emerald-950/20 border-emerald-500/20 text-emerald-200";
                letterBackground = "bg-emerald-500 text-white";
              }

              return (
                <button
                  key={idx}
                  id={`opt-${currentQuestion.id}-${idx}`}
                  onClick={() => handleSelectOption(idx)}
                  disabled={submitted}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3.5 group relative ${btnClass}`}
                >
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${letterBackground}`}>
                    {letter}
                  </span>
                  <span className="text-sm font-medium">{option}</span>
                </button>
              );
            })}
          </div>

          {/* Submit question action bar */}
          <div className="flex gap-3 justify-end pt-2">
            {!submitted ? (
              <button
                id="q-submit-btn"
                onClick={() => setSubmitted(true)}
                disabled={!hasAnsweredCurrent}
                className={`px-5 py-3 rounded-xl font-bold text-sm tracking-wide transition-all ${
                  hasAnsweredCurrent
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white cursor-pointer shadow-lg"
                    : "bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed"
                }`}
              >
                提交此题并看解析
              </button>
            ) : (
              <button
                id="q-next-btn"
                onClick={handleNext}
                className="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] transition-all rounded-xl font-bold text-sm tracking-wide shadow-lg flex items-center gap-1 cursor-pointer"
              >
                {isLastQuestion ? "提交试卷" : "下一道题"}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>

        {/* Right Panel: Solution, Formulas & AI Tutor Consultation (Col: 4) */}
        <div className="md:col-span-4 bg-white/5 backdrop-blur-md p-6 flex flex-col justify-between border-l border-white/10">
          <div className="space-y-6">
            {!submitted ? (
              <div className="text-center py-12 px-4 space-y-3">
                <div className="w-14 h-14 bg-white/5 text-slate-400 rounded-full flex items-center justify-center mx-auto border border-dashed border-white/10">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-200">智能解析与学科小贴士</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    选择选项提交之后，AI 老师的详尽知识点剖析、公式推导与深度白话解析都将在这里呈现，帮助您扫清认知盲点。
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in max-h-[420px] overflow-y-auto pr-1">
                <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                  {isCorrect ? (
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      极棒！你答对了
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-rose-400 font-bold text-sm">
                      <XCircle className="w-4 h-4" />
                      噢，不小心选错了
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">AI 老师黑板深度解答:</span>
                  <p className="text-xs font-semibold text-slate-200 bg-white/5 p-3 rounded-xl border border-white/10 shadow-sm leading-relaxed">
                    {currentQuestion.explanation}
                  </p>
                </div>

                {/* AI Consult Portal */}
                <div className="pt-2 border-t border-white/10">
                  <div className="flex items-center gap-1.5 text-blue-300 text-xs font-bold mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    还没看懂？咨询 AI 特级名师
                  </div>

                  {aiAnswers[currentQuestion.id] ? (
                    <div className="bg-blue-950/40 border border-blue-500/20 rounded-2xl p-3.5 text-xs mb-3 space-y-2 text-blue-100">
                      <div className="flex items-center gap-1.5 font-bold text-blue-300">
                        <MessageCircle className="w-3.5 h-3.5" />
                        AI 特级名师专属启发：
                      </div>
                      <div className="text-slate-200 space-y-1">
                        {renderSimpleMarkdown(aiAnswers[currentQuestion.id])}
                      </div>
                      <button 
                        onClick={() => {
                          setAiAnswers(prev => {
                            const clone = { ...prev };
                            delete clone[currentQuestion.id];
                            return clone;
                          });
                        }}
                        className="text-[10px] text-blue-300 hover:text-blue-200 font-medium cursor-pointer pt-1 block"
                      >
                        重新提问
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleConsultAi} className="space-y-2">
                      <div className="relative">
                        <textarea
                          rows={2}
                          value={childQuery}
                          onChange={(e) => setChildQuery(e.target.value)}
                          placeholder="例如: 老师，为什么长江里面的水比海水密度更低呢？或者是这道题算出的 37g 是怎么一步步除的？"
                          className="w-full text-xs p-2.5 bg-white/5 border border-white/10 hover:border-white/20 focus:border-blue-500 rounded-xl focus:outline-none placeholder:text-slate-400 leading-relaxed font-medium text-white"
                          disabled={consulting}
                        />
                      </div>
                      
                      {consultError && (
                        <div className="text-[10px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/25 p-2 rounded-lg text-center leading-normal">
                          ⚠️ {consultError}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={consulting || !childQuery.trim()}
                        className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                          childQuery.trim() && !consulting
                            ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-lg"
                            : "bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed"
                        }`}
                      >
                        {consulting ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            AI 老师撰写生动解答中...
                          </>
                        ) : (
                          <>
                            <MessageCircle className="w-3 h-3" />
                            向 AI 老师发送疑问
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-white/10 text-center text-[10px] text-slate-400 font-medium">
            看视频做测评，掌握全科知识原来这么简单有趣 💡
          </div>
        </div>

      </div>
    </div>
  );
}
