import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { FileText, MessageSquare } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { aiApi } from "@/lib/api";
import toast from "react-hot-toast";
import AIChatbot from "@/components/CareerAssistantAI";

interface SummaryResult {
  overview?: string;
  keyPoints?: Array<{ importance: string; point: string }>;
  examQuestions?: Array<{ question: string; answer: string }>;
  actionItems?: string[];
}

export default function Documents() {
  const { profile, addXp } = useAuth();
  const [tab, setTab] = useState<'summarize' | 'chat'>('chat');
  const [summaryResult, setSummaryResult] = useState<SummaryResult | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [docText, setDocText] = useState('');
  const [analysisType, setAnalysisType] = useState('career');

  const handleSummarize = async () => {
    if (!docText.trim()) { toast.error("Paste some text to summarize"); return; }
    setSummarizing(true);
    try {
      const data = await aiApi.summarizeDocument({ content: docText, summaryType: analysisType });
      setSummaryResult(data);
      await addXp(15, "Document summarized!");
      toast.success("Document summarized! 📄");
    } catch (err) {
      console.error(err);
      toast.error("Summarization failed");
    } finally {
      setSummarizing(false);
    }
  };

  return (
    <PageTransition>
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 h-[52px] border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-full items-center justify-between px-6">
          <a href="/" className="text-lg font-bold text-foreground">AI Career Compass</a>
          <a href="/profile" className="text-sm text-text-secondary hover:text-foreground transition-colors">Profile</a>
        </div>
      </nav>

      <div className="container mx-auto max-w-3xl px-6 pt-[68px] pb-12">
        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab('summarize')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${tab === 'summarize' ? 'bg-primary text-primary-foreground' : 'border border-border text-text-secondary'}`}>
            <FileText className="h-4 w-4" /> Summarize Document
          </button>
          <button onClick={() => setTab('chat')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${tab === 'chat' ? 'bg-primary text-primary-foreground' : 'border border-border text-text-secondary'}`}>
            <MessageSquare className="h-4 w-4" /> AI Career Assistant
          </button>
        </div>

        {tab === 'summarize' ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <textarea value={docText} onChange={e => setDocText(e.target.value)} rows={8}
              placeholder="Paste your document text here..."
              className="w-full rounded-lg border border-border bg-background p-4 text-sm text-foreground placeholder:text-text-muted focus:border-primary focus:outline-none resize-none" />
            <div className="mt-4 grid grid-cols-2 gap-2">
              {[
                { key: "career", label: "Summarize for my career" },
                { key: "terms", label: "Extract key terms" },
                { key: "study", label: "Create study guide" },
                { key: "exam", label: "Generate exam questions" },
              ].map(opt => (
                <button key={opt.key} onClick={() => setAnalysisType(opt.key)}
                  className={`rounded-lg border p-3 text-left text-xs transition-all duration-200 ${
                    analysisType === opt.key ? "border-primary bg-primary/10 text-primary" : "border-border text-text-secondary hover:border-border-hover"
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
            <button onClick={handleSummarize} disabled={summarizing} className="btn-primary w-full mt-4 disabled:opacity-50">
              {summarizing ? "🤖 Analyzing..." : "Analyze Document"}
            </button>

            {summaryResult && (
              <div className="mt-6 space-y-4">
                {summaryResult.overview && (
                  <div className="glass-card">
                    <h3 className="font-semibold text-foreground mb-2">Overview</h3>
                    <p className="text-sm text-text-secondary">{summaryResult.overview}</p>
                  </div>
                )}
                {summaryResult.keyPoints?.length > 0 && (
                  <div className="glass-card">
                    <h3 className="font-semibold text-foreground mb-2">Key Points</h3>
                    {summaryResult.keyPoints.map((kp, i) => (
                      <div key={i} className="flex gap-2 mb-2">
                        <span className={`rounded-pill px-2 py-0.5 text-[10px] font-medium ${
                          kp.importance === 'high' ? 'bg-destructive/20 text-destructive' : kp.importance === 'medium' ? 'bg-warning/20 text-warning' : 'bg-muted text-text-muted'
                        }`}>{kp.importance}</span>
                        <p className="text-sm text-text-secondary">{kp.point}</p>
                      </div>
                    ))}
                  </div>
                )}
                {summaryResult.examQuestions?.length > 0 && (
                  <div className="glass-card">
                    <h3 className="font-semibold text-foreground mb-2">Exam Questions</h3>
                    {summaryResult.examQuestions.map((q, i) => (
                      <div key={i} className="mb-3">
                        <p className="text-sm font-medium text-foreground">Q{i + 1}: {q.question}</p>
                        <p className="text-xs text-text-secondary mt-1">A: {q.answer}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-background overflow-hidden" style={{ height: 'calc(100vh - 160px)' }}>
            <AIChatbot />
          </motion.div>
        )}
      </div>
    </div>
    </PageTransition>
  );
}
