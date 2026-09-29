import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { useAuth } from "@/hooks/useAuth";
import { aiApi } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Loader2, FileText, Lightbulb, BookOpen, HelpCircle, ExternalLink, ChevronDown, ChevronUp, Sparkles, Copy, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

interface KeyPoint { title: string; detail: string; importance: string; }
interface Mnemonic { trick: string; helpsRemember: string; }
interface Formula { name: string; formula: string; usage: string; }
interface ExamQuestion { question: string; answer: string; marks: string; }
interface Resource { name: string; type: string; link: string; }

interface StudyNotes {
  title: string;
  summary: string;
  keyPoints: KeyPoint[];
  mnemonics: Mnemonic[];
  formulas: Formula[];
  examQuestions: ExamQuestion[];
  resources: Resource[];
}

const LEVELS = ["Class 8-10", "Class 11-12", "B.Tech / Degree", "Competitive Exams"];

export default function StudyNotesPage() {
  const { profile, addXp } = useAuth();
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("Class 11-12");
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<StudyNotes | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    keyPoints: true, mnemonics: true, formulas: true, examQuestions: false, resources: false,
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleSection = (key: string) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Copied!");
  };

  const generateNotes = async () => {
    if (!topic.trim() || topic.trim().length < 3) {
      toast.error("Enter a topic (at least 3 characters)");
      return;
    }
    setLoading(true);
    try {
      const data = await aiApi.studyNotes({
        topic: topic.trim(),
        noteType: level,
        career: profile?.selected_career ? (profile.selected_career as { title?: string }).title : undefined,
      });
      setNotes(data as StudyNotes);
      addXp(10, "Generated study notes");
      toast.success("Notes generated! 📝");
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Failed to generate notes";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const Section = ({ id, title, icon: Icon, color, children, count }: { id: string; title: string; icon: React.ElementType; color: string; children: React.ReactNode; count: number }) => {
    const open = expandedSections[id];
    return (
      <div className="glass-card">
        <button onClick={() => toggleSection(id)} className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${color}`}>
              <Icon className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            {count > 0 && <span className="px-1.5 py-0.5 rounded-full bg-muted text-[10px] font-medium text-muted-foreground">{count}</span>}
          </div>
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
        <AnimatePresence>
          {open && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="mt-4 space-y-3">{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const importanceColor = (imp: string) =>
    imp === "high" ? "border-l-destructive" : imp === "medium" ? "border-l-warning" : "border-l-success";

  return (
    <PageTransition>
      <div className="w-full max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10">
              <FileText className="h-5 w-5 text-success" />
            </span>
            AI Study Notes
          </h1>
          <p className="text-sm text-muted-foreground">Enter any topic and get structured notes instantly</p>
        </div>

        {/* Input form */}
        <div className="glass-card space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Topic</label>
            <Input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              onKeyDown={e => e.key === "Enter" && generateNotes()}
              placeholder="e.g. Photosynthesis, Newton's Laws, Indian Constitution..."
              className="text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Level</label>
            <div className="flex flex-wrap gap-2">
              {LEVELS.map(l => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    level === l ? "bg-primary/10 text-primary ring-2 ring-primary/30" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <motion.button
            onClick={generateNotes}
            disabled={loading || topic.trim().length < 3}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="btn-primary w-full py-3 text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating Notes...</> :
             <><Sparkles className="h-4 w-4" /> Generate Notes</>}
          </motion.button>
        </div>

        {/* Generated notes */}
        <AnimatePresence>
          {notes && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Title & summary */}
              <div className="glass-card">
                <h2 className="text-lg font-bold text-foreground mb-2">{notes.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{notes.summary}</p>
              </div>

              {/* Key Points */}
              <Section id="keyPoints" title="Key Points" icon={BookOpen} color="bg-primary/10 text-primary" count={notes.keyPoints?.length}>
                {notes.keyPoints?.map((kp, i) => (
                  <div key={i} className={`border-l-2 ${importanceColor(kp.importance)} rounded-r-lg bg-muted/30 p-3`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-foreground">{kp.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{kp.detail}</p>
                      </div>
                      <button onClick={() => copyText(`${kp.title}: ${kp.detail}`, `kp-${i}`)} className="shrink-0">
                        {copiedId === `kp-${i}` ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />}
                      </button>
                    </div>
                  </div>
                ))}
              </Section>

              {/* Mnemonics */}
              <Section id="mnemonics" title="Memory Tricks" icon={Lightbulb} color="bg-warning/10 text-warning" count={notes.mnemonics?.length}>
                {notes.mnemonics?.map((m, i) => (
                  <div key={i} className="rounded-lg bg-warning/5 border border-warning/20 p-3">
                    <p className="text-sm font-bold text-foreground">💡 {m.trick}</p>
                    <p className="text-xs text-muted-foreground mt-1">Helps remember: {m.helpsRemember}</p>
                  </div>
                ))}
              </Section>

              {/* Formulas */}
              {notes.formulas?.length > 0 && (
                <Section id="formulas" title="Formulas & Definitions" icon={Sparkles} color="bg-accent/10 text-accent" count={notes.formulas?.length}>
                  {notes.formulas?.map((f, i) => (
                    <div key={i} className="rounded-lg bg-accent/5 border border-accent/20 p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-foreground">{f.name}</h4>
                          <p className="text-sm font-mono text-accent mt-1">{f.formula}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">{f.usage}</p>
                        </div>
                        <button onClick={() => copyText(f.formula, `f-${i}`)} className="shrink-0">
                          {copiedId === `f-${i}` ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </Section>
              )}

              {/* Exam Questions */}
              <Section id="examQuestions" title="Practice Questions" icon={HelpCircle} color="bg-destructive/10 text-destructive" count={notes.examQuestions?.length}>
                {notes.examQuestions?.map((eq, i) => (
                  <ExamQuestionCard key={i} eq={eq} index={i} />
                ))}
              </Section>

              {/* Resources */}
              <Section id="resources" title="Recommended Resources" icon={ExternalLink} color="bg-success/10 text-success" count={notes.resources?.length}>
                {notes.resources?.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium uppercase">{r.type}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground">{r.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{r.link}</p>
                    </div>
                  </div>
                ))}
              </Section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}

function ExamQuestionCard({ eq, index }: { eq: ExamQuestion; index: number }) {
  const [showAnswer, setShowAnswer] = useState(false);
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-foreground flex-1">Q{index + 1}. {eq.question}</p>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">{eq.marks}m</span>
      </div>
      <button onClick={() => setShowAnswer(!showAnswer)} className="text-[10px] text-primary font-medium mt-2">
        {showAnswer ? "Hide Answer" : "Show Answer"}
      </button>
      <AnimatePresence>
        {showAnswer && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed border-t border-border pt-2">{eq.answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
