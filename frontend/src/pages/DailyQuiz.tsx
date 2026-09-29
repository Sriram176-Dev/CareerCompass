import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { useAuth } from "@/hooks/useAuth";
import { aiApi } from "@/lib/api";
import { Loader2, Zap, Trophy, CheckCircle2, XCircle, Clock, Brain, Flame, RotateCcw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import toast from "react-hot-toast";

interface Question {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  correctAnswer?: string;
  explanation: string;
  category: string;
  difficulty: string;
}

interface QuizAttempt {
  category: string;
  score: number;
  total: number;
  difficulty: string;
  timestamp: string;
}

const CATEGORIES = [
  { value: "General Knowledge", label: "🌍 GK", color: "bg-primary/10 text-primary" },
  { value: "Aptitude", label: "🧮 Aptitude", color: "bg-warning/10 text-warning" },
  { value: "Reasoning", label: "🧩 Reasoning", color: "bg-accent/10 text-accent" },
  { value: "Science", label: "🔬 Science", color: "bg-success/10 text-success" },
  { value: "Current Affairs", label: "📰 Current Affairs", color: "bg-destructive/10 text-destructive" },
];

const DIFFICULTIES = [
  { value: "easy", label: "Easy", desc: "Class 8-10" },
  { value: "medium", label: "Medium", desc: "Class 11-12" },
  { value: "hard", label: "Hard", desc: "Competitive" },
];

export default function DailyQuiz() {
  const { profile, addXp, updateProfile } = useAuth();
  const career = profile?.selected_career as string | undefined;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [category, setCategory] = useState("General Knowledge");
  const [difficulty, setDifficulty] = useState("medium");
  const [dailyTip, setDailyTip] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);

  // Timer
  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return;
    const t = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [timerActive, timeLeft]);

  const handleAnswer = useCallback((optionIndex: number) => {
    if (showResult) return;
    setSelectedAnswer(optionIndex);
    setShowResult(true);
    setTimerActive(false);
    const correct = optionIndex === questions[currentQ]?.correctIndex;
    if (correct) setScore(prev => prev + 1);
    setAnswers(prev => [...prev, optionIndex]);
  }, [showResult, questions, currentQ]);

  useEffect(() => {
    if (timeLeft === 0 && timerActive) {
      handleAnswer(-1); // auto-submit wrong on timeout
    }
  }, [timeLeft, timerActive, handleAnswer]);

  const startQuiz = async () => {
    setLoading(true);
    setQuizComplete(false);
    setCurrentQ(0);
    setScore(0);
    setAnswers([]);
    setSelectedAnswer(null);
    setShowResult(false);
    try {
      const data = await aiApi.dailyQuiz({ career, topic: category, difficulty });
      // Normalize: AI sometimes returns correctAnswer "A"/"B"/"C"/"D" instead of correctIndex 0/1/2/3
      const questions = (data.questions || []).map((q: { correctIndex?: number; correctAnswer?: string; [key: string]: unknown }) => ({
        ...q,
        correctIndex: typeof q.correctIndex === "number"
          ? q.correctIndex
          : { A: 0, B: 1, C: 2, D: 3 }[q.correctAnswer as string] ?? 0,
      }));
      setQuestions(questions);
      setDailyTip(data.dailyTip || "");
      setTimeLeft(difficulty === "easy" ? 45 : difficulty === "medium" ? 30 : 20);
      setTimerActive(true);
      toast.success("Quiz started! 🧠");
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Failed to generate quiz";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const nextQuestion = () => {
    if (currentQ + 1 >= questions.length) {
      setQuizComplete(true);
      setTimerActive(false);
      const xpEarned = score * (difficulty === "hard" ? 15 : difficulty === "medium" ? 10 : 5);
      if (xpEarned > 0) addXp(xpEarned, `Quiz: ${score}/${questions.length} correct`);
      // Persist this attempt — feeds the Living Roadmap pulse (weak-category
      // detection) and Counselor Memory (chat can reference real struggles).
      const attempt: QuizAttempt = { category, score, total: questions.length, difficulty, timestamp: new Date().toISOString() };
      const updatedAttempts = [...((profile?.quiz_attempts as QuizAttempt[]) || []), attempt].slice(-30);
      updateProfile({ quiz_attempts: updatedAttempts }).catch(() => null);
    } else {
      setCurrentQ(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setTimeLeft(difficulty === "easy" ? 45 : difficulty === "medium" ? 30 : 20);
      setTimerActive(true);
    }
  };

  const q = questions[currentQ];

  return (
    <PageTransition>
      <div className="w-full max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10">
              <Brain className="h-5 w-5 text-warning" />
            </span>
            Daily Quiz Challenge
          </h1>
          <p className="text-sm text-muted-foreground">Test your knowledge daily and earn XP</p>
        </div>

        {questions.length === 0 || quizComplete ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Quiz complete results */}
            {quizComplete && (
              <div className="glass-card text-center space-y-4">
                <Trophy className="h-14 w-14 mx-auto text-warning" />
                <h2 className="text-2xl font-bold text-foreground">Quiz Complete!</h2>
                <div className="text-5xl font-black text-primary">{score}/{questions.length}</div>
                <p className="text-sm text-muted-foreground">
                  {score === questions.length ? "Perfect score! 🎉" :
                   score >= questions.length * 0.8 ? "Excellent work! 💪" :
                   score >= questions.length * 0.5 ? "Good effort! Keep practicing 📚" :
                   "Don't give up! Practice makes perfect 🌱"}
                </p>
                <div className="text-xs text-success font-medium">
                  +{score * (difficulty === "hard" ? 15 : difficulty === "medium" ? 10 : 5)} XP earned
                </div>

                {/* Review answers */}
                <div className="mt-6 space-y-3 text-left">
                  {questions.map((question, i) => {
                    const userAns = answers[i];
                    const correct = userAns === question.correctIndex;
                    return (
                      <div key={i} className={`rounded-lg border p-3 ${correct ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"}`}>
                        <div className="flex items-start gap-2">
                          {correct ? <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" /> : <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />}
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-foreground">{question.question}</p>
                            {!correct && (
                              <p className="text-[10px] text-success mt-1">✓ {question.options[question.correctIndex]}</p>
                            )}
                            <p className="text-[10px] text-muted-foreground mt-1">{question.explanation}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Setup */}
            <div className="glass-card space-y-5">
              <h3 className="font-semibold text-foreground text-sm">{quizComplete ? "Play Again?" : "Configure Quiz"}</h3>

              {/* Category */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setCategory(c.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        category === c.value ? c.color + " ring-2 ring-primary/30" : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Difficulty</label>
                <div className="grid grid-cols-3 gap-2">
                  {DIFFICULTIES.map(d => (
                    <button
                      key={d.value}
                      onClick={() => setDifficulty(d.value)}
                      className={`p-3 rounded-xl text-center transition-all border ${
                        difficulty === d.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      <div className="text-sm font-semibold">{d.label}</div>
                      <div className="text-[10px]">{d.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <motion.button
                onClick={startQuiz}
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="btn-primary w-full py-3 text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating Quiz...</> :
                 quizComplete ? <><RotateCcw className="h-4 w-4" /> Play Again</> :
                 <><Zap className="h-4 w-4" /> Start Quiz</>}
              </motion.button>
            </div>

            {dailyTip && (
              <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-3">
                <p className="text-xs text-primary">💡 <span className="font-medium">Tip:</span> {dailyTip}</p>
              </div>
            )}
          </motion.div>
        ) : q && (
          /* Active quiz */
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQ}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Progress */}
              <div className="flex items-center gap-3">
                <Progress value={((currentQ + 1) / questions.length) * 100} className="h-2 flex-1" />
                <span className="text-xs font-medium text-muted-foreground">{currentQ + 1}/{questions.length}</span>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${timeLeft <= 5 ? "bg-destructive/10 text-destructive animate-pulse" : "bg-muted text-muted-foreground"}`}>
                  <Clock className="h-3 w-3" />
                  {timeLeft}s
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-success">
                  <Flame className="h-3 w-3" /> {score}
                </div>
              </div>

              {/* Question card */}
              <div className="glass-card">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    q.difficulty === "hard" ? "bg-destructive/10 text-destructive" :
                    q.difficulty === "medium" ? "bg-warning/10 text-warning" :
                    "bg-success/10 text-success"
                  }`}>{q.difficulty}</span>
                  <span className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-medium text-muted-foreground">{q.category}</span>
                </div>

                <h2 className="text-base font-semibold text-foreground mb-4 leading-relaxed">{q.question}</h2>

                <div className="space-y-2">
                  {q.options.map((opt, i) => {
                    let btnClass = "border-border bg-card hover:border-primary/40 hover:bg-primary/5";
                    if (showResult) {
                      if (i === q.correctIndex) btnClass = "border-success bg-success/10 text-success";
                      else if (i === selectedAnswer && i !== q.correctIndex) btnClass = "border-destructive bg-destructive/10 text-destructive";
                      else btnClass = "border-border bg-card opacity-50";
                    }
                    return (
                      <motion.button
                        key={i}
                        onClick={() => handleAnswer(i)}
                        disabled={showResult}
                        whileHover={!showResult ? { scale: 1.01 } : {}}
                        whileTap={!showResult ? { scale: 0.99 } : {}}
                        className={`w-full text-left p-3 rounded-xl border transition-all text-sm ${btnClass}`}
                      >
                        <span className="font-semibold mr-2 text-muted-foreground">{String.fromCharCode(65 + i)}.</span>
                        {opt}
                      </motion.button>
                    );
                  })}
                </div>

                {showResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 space-y-3"
                  >
                    <div className={`rounded-lg px-3 py-2 text-xs ${
                      selectedAnswer === q.correctIndex ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                    }`}>
                      {selectedAnswer === q.correctIndex ? "✅ Correct!" : "❌ Incorrect"}
                    </div>
                    <div className="rounded-lg bg-muted px-3 py-2">
                      <p className="text-xs text-muted-foreground">{q.explanation}</p>
                    </div>
                    <motion.button
                      onClick={nextQuestion}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      className="btn-primary w-full py-2.5 text-sm font-semibold"
                    >
                      {currentQ + 1 >= questions.length ? "See Results" : "Next Question →"}
                    </motion.button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </PageTransition>
  );
}
