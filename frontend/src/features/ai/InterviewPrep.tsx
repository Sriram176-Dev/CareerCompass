import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, RefreshCw } from "lucide-react";
import { aiApi } from "@/services/api";
import toast from "react-hot-toast";

interface Question {
  question: string;
  type: string;
  difficulty: string;
  idealAnswer: string;
  tip: string;
  commonMistake: string;
}

export default function InterviewPrep({ career }: { career: string | { title?: string } }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const generateQuestions = async () => {
    setLoading(true);
    setQuestions([]);
    setSelectedIdx(null);
    setFeedback("");
    try {
      const data = await aiApi.careerTools("interview-questions", { career: career?.title || career, level: "fresher" });
      setQuestions(data.questions || []);
    } catch {
      toast.error("Failed to generate questions");
    } finally {
      setLoading(false);
    }
  };

  const getAnswerFeedback = async () => {
    if (!userAnswer.trim() || selectedIdx === null) return;
    setFeedbackLoading(true);
    try {
      const data = await aiApi.careerTools("interview-feedback", {
        career: career?.title || career,
        specificQuestion: questions[selectedIdx].question,
        userAnswer,
      });
      // Show rich feedback with score
      const score = data.score ? `\n\n**Score: ${data.score}/10**` : "";
      const tip = data.tipForIndianInterview ? `\n\n💡 **Indian Interview Tip:** ${data.tipForIndianInterview}` : "";
      const better = data.betterAnswer ? `\n\n**Model Answer:**\n${data.betterAnswer}` : "";
      setFeedback((data.feedback || "Good attempt!") + score + tip + better);
    } catch {
      toast.error("Failed to get feedback");
    } finally {
      setFeedbackLoading(false);
    }
  };

  const difficultyColor: Record<string, string> = {
    hard: "bg-destructive/10 text-destructive",
    medium: "bg-warning/10 text-warning",
    easy: "bg-success/10 text-success",
  };

  return (
    <div className="glass-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Mic className="h-4 w-4 text-primary" /> Interview Prep
        </h3>
        <button onClick={generateQuestions} disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Generating..." : questions.length ? "New Questions" : "Generate Questions"}
        </button>
      </div>

      {questions.length === 0 && !loading && (
        <p className="text-sm text-muted-foreground text-center py-6">Generate AI-powered interview questions for {career.title}</p>
      )}

      <div className="space-y-2">
        {questions.map((q, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={() => { setSelectedIdx(i); setFeedback(""); setUserAnswer(""); }}
            className={`rounded-lg border p-3 cursor-pointer transition-colors ${
              selectedIdx === i
                ? "border-primary bg-primary/5"
                : "border-border hover:border-border-hover"
            }`}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-foreground">{q.question}</p>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${difficultyColor[q.difficulty] || "bg-muted text-muted-foreground"}`}>
                {q.difficulty}
              </span>
            </div>

            <AnimatePresence>
              {selectedIdx === i && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden">
                  <div className="mt-3 space-y-3">
                    <textarea
                      value={userAnswer}
                      onChange={e => setUserAnswer(e.target.value)}
                      placeholder="Type your answer here..."
                      className="w-full min-h-[80px] rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none"
                    />
                    <button onClick={getAnswerFeedback} disabled={feedbackLoading || !userAnswer.trim()}
                      className="btn-primary text-xs px-4 py-1.5 disabled:opacity-50">
                      {feedbackLoading ? "Analyzing..." : "Get AI Feedback"}
                    </button>

                    {feedback && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-xs text-muted-foreground leading-relaxed">
                        {feedback}
                      </motion.div>
                    )}

                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-[10px] font-semibold text-primary mb-1">💡 Tip</p>
                      <p className="text-xs text-muted-foreground">{q.tip}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
