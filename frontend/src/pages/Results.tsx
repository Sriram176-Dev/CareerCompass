import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CAREERS, CAREER_CATEGORIES } from "@/data/careers";
import { Heart, GitCompareArrows, X, Download, ChevronRight, Briefcase, GraduationCap, IndianRupee, TrendingUp, Building2, BookOpen } from "lucide-react";
import ShareResultsCard from "@/components/ShareResultsCard";
import NotificationCenter from "@/components/NotificationCenter";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { SkeletonCard } from "@/components/SkeletonLoaders";
import PageTransition from "@/components/PageTransition";
import { AnimatedNumber } from "@/components/AnimatedComponents";
import toast from "react-hot-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface CareerWithScore {
  id: string;
  title: string;
  icon: string;
  category: string;
  cat: string;
  matchScore: number;
  aiReason?: string;
  ruleScore?: number;
  aiScore?: number;
  semanticScore?: number;
  topFactors?: string[];
  salary?: { min: number; max: number; average: number };
  salaryRange: string;
  education?: string[];
  skills?: string[];
  growth?: string;
  description?: string;
  desc?: string;
  entryLevel?: string;
  seniorLevel?: string;
  jobDemand: string;
  workStyle?: string;
  environment?: string;
  longDesc?: string;
}

// Career Detail Modal
function CareerDetailModal({ career, onClose, onSelect }: { career: CareerWithScore; onClose: () => void; onSelect: (c: CareerWithScore) => void }) {
  const navigate = useNavigate();
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-card p-6"
        onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{career.icon}</span>
            <div>
              <h2 className="text-xl font-bold text-foreground">{career.title}</h2>
              <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-bold text-primary">
                {Math.round(career.matchScore)}% Compass Fit
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        {/* AI Reason */}
        {career.aiReason && (
          <div className="mb-4 rounded-xl bg-primary/5 border border-primary/20 p-3">
            <p className="text-xs text-primary italic">🤖 {career.aiReason}</p>
          </div>
        )}

        {/* Explainable match breakdown — why this score, not just what it is */}
        {(career.ruleScore != null || career.aiScore != null || career.semanticScore != null || career.topFactors?.length > 0) && (
          <div className="mb-4 rounded-xl border border-border bg-muted/30 p-3">
            <p className="mb-2 text-xs font-semibold text-foreground">How this Compass Fit Score was built</p>
            {(career.ruleScore != null || career.aiScore != null || career.semanticScore != null) && (
              <div className="mb-2 space-y-1.5">
                {career.ruleScore != null && (
                  <div className="flex items-center gap-2">
                    <span className="w-24 shrink-0 text-[11px] text-muted-foreground">Your interests</span>
                    <div className="h-1.5 flex-1 rounded-full bg-border">
                      <div className="h-1.5 rounded-full bg-sky-500" style={{ width: `${Math.min(100, career.ruleScore)}%` }} />
                    </div>
                    <span className="w-8 shrink-0 text-right text-[11px] font-medium text-foreground">{Math.round(career.ruleScore)}%</span>
                  </div>
                )}
                {career.aiScore != null && (
                  <div className="flex items-center gap-2">
                    <span className="w-24 shrink-0 text-[11px] text-muted-foreground">AI confidence</span>
                    <div className="h-1.5 flex-1 rounded-full bg-border">
                      <div className="h-1.5 rounded-full bg-primary" style={{ width: `${Math.min(100, career.aiScore)}%` }} />
                    </div>
                    <span className="w-8 shrink-0 text-right text-[11px] font-medium text-foreground">{Math.round(career.aiScore)}%</span>
                  </div>
                )}
                {career.semanticScore != null && (
                  <div className="flex items-center gap-2">
                    <span className="w-24 shrink-0 text-[11px] text-muted-foreground">Description match</span>
                    <div className="h-1.5 flex-1 rounded-full bg-border">
                      <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${Math.min(100, career.semanticScore)}%` }} />
                    </div>
                    <span className="w-8 shrink-0 text-right text-[11px] font-medium text-foreground">{Math.round(career.semanticScore)}%</span>
                  </div>
                )}
              </div>
            )}
            {career.topFactors?.length > 0 && (
              <p className="text-[11px] text-muted-foreground">
                Driven mostly by: <span className="text-foreground">{career.topFactors.join(", ")}</span>
              </p>
            )}
            <Link to="/how-it-works" className="mt-2 inline-block text-[11px] text-primary hover:underline">
              How the Compass Fit Score is calculated →
            </Link>
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-5">{career.desc}</p>

        {/* Key Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <div className="flex items-center gap-2 mb-1">
              <IndianRupee className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">Salary (CTC)</span>
            </div>
            <p className="text-sm font-bold text-foreground">{career.salaryRange}</p>
            {career.entryLevel && <p className="text-[10px] text-muted-foreground mt-0.5">Entry: {career.entryLevel}</p>}
            {career.seniorLevel && <p className="text-[10px] text-muted-foreground">Senior: {career.seniorLevel}</p>}
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">Job Demand</span>
            </div>
            <p className="text-sm font-bold text-foreground">{career.jobDemand}</p>
            {career.growth && <p className="text-[10px] text-muted-foreground mt-0.5">Growth: {career.growth}</p>}
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <div className="flex items-center gap-2 mb-1">
              <GraduationCap className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">Education</span>
            </div>
            <p className="text-xs text-foreground">{career.education || "Degree Required"}</p>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">Work Style</span>
            </div>
            <p className="text-xs text-foreground">{career.workStyle || career.environment || "Office"}</p>
          </div>
        </div>

        {/* What They Do */}
        <div className="mb-4">
          <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" /> What They Do
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">{career.longDesc || career.desc}</p>
        </div>

        {/* Skills */}
        {career.skills?.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-bold text-foreground mb-2">🛠️ Key Skills</h4>
            <div className="flex flex-wrap gap-1.5">
              {career.skills.map((s: string) => (
                <span key={s} className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-1 text-[11px] text-primary">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Entrance Exams */}
        {career.examPath?.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-bold text-foreground mb-2">📝 Entrance Exams</h4>
            <div className="flex flex-wrap gap-1.5">
              {career.examPath.map((e: string) => (
                <span key={e} className="rounded-full bg-accent/10 border border-accent/20 px-2.5 py-1 text-[11px] text-accent">{e}</span>
              ))}
            </div>
          </div>
        )}

        {/* Top Companies */}
        {career.topCompanies?.length > 0 && (
          <div className="mb-5">
            <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" /> Top Companies
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {career.topCompanies.map((c: string) => (
                <span key={c} className="rounded-full bg-muted border border-border px-2.5 py-1 text-[11px] text-foreground">{c}</span>
              ))}
            </div>
          </div>
        )}

        {/* Select Button */}
        <motion.button
          onClick={() => onSelect(career)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full btn-primary flex items-center justify-center gap-2 py-3 text-sm font-bold"
        >
          🎯 Select This Career & Get Roadmap
          <ChevronRight className="h-4 w-4" />
        </motion.button>
        <button
          onClick={() => navigate("/simulator", { state: { career } })}
          className="w-full btn-outline mt-2.5 flex items-center justify-center gap-2 py-2.5 text-sm font-medium"
        >
          🎬 Try a day as a {career.title}
        </button>
      </motion.div>
    </motion.div>
  );
}

function CompareModal({ careers, onClose }: { careers: CareerWithScore[]; onClose: () => void }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [a, b] = careers;

  const compareFields = [
    { label: "Salary Range", key: "salaryRange", icon: "💰" },
    { label: "Entrance Exam", key: "examPath", icon: "📝" },
    { label: "Top College", key: "topColleges", icon: "🎓" },
    { label: "Job Demand", key: "jobDemand", icon: "📈" },
    { label: "Work Environment", key: "environment", icon: "🏢" },
    { label: "Education", key: "education", icon: "📚" },
    { label: "Compass Fit Score", key: "matchScore", icon: "🧭" },
  ];

  const handleExportPDF = async () => {
    if (!contentRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(contentRef.current, { backgroundColor: "#12141A", scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width, canvas.height] });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`${a.title}_vs_${b.title}_comparison.pdf`);
      toast.success("PDF downloaded!");
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const getCellValue = (career: CareerWithScore, key: string) => {
    const val = career[key];
    if (key === "matchScore") return `${Math.round(val)}%`;
    if (Array.isArray(val)) return val.slice(0, 2).join(", ");
    return val || "—";
  };

  const aiVerdict = useMemo(() => {
    const aScore = a.matchScore || 0;
    const bScore = b.matchScore || 0;
    const stronger = aScore >= bScore ? a : b;
    const other = aScore >= bScore ? b : a;
    return `Based on your profile, ${stronger.title} is the stronger match (${Math.round(stronger.matchScore)}%). However, ${other.title} offers ${other.jobDemand === "Very High" ? "higher job demand" : "different strengths"} worth considering.`;
  }, [a, b]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-xl border border-border bg-card p-6"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <GitCompareArrows className="h-5 w-5 text-primary" /> Career Comparison
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={handleExportPDF} disabled={exporting}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors disabled:opacity-50">
              <Download className="h-3.5 w-3.5" />
              {exporting ? "Exporting…" : "Export PDF"}
            </button>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
          </div>
        </div>

        <div ref={contentRef}>
          <div className="grid grid-cols-[1fr_1fr_1fr] gap-3 mb-4">
            <div />
            {[a, b].map(c => (
              <div key={c.id} className="text-center">
                <span className="text-3xl">{c.icon}</span>
                <p className="mt-1 text-sm font-semibold text-foreground">{c.title}</p>
                <span className="inline-block mt-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                  {Math.round(c.matchScore)}% fit
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-0">
            {compareFields.map((field, i) => (
              <div key={field.key} className={`grid grid-cols-[1fr_1fr_1fr] gap-3 py-3 text-sm ${i < compareFields.length - 1 ? "border-b border-border" : ""} ${i % 2 === 0 ? "bg-secondary/30" : ""}`}>
                <span className="text-muted-foreground font-medium flex items-center gap-2 px-2">
                  <span>{field.icon}</span> {field.label}
                </span>
                <span className="text-foreground text-center">{getCellValue(a, field.key)}</span>
                <span className="text-foreground text-center">{getCellValue(b, field.key)}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl bg-primary/5 border border-primary/20 p-4">
            <h4 className="text-sm font-bold text-primary flex items-center gap-2 mb-2">🤖 AI Verdict</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">{aiVerdict}</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Results() {
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedDetail, setSelectedDetail] = useState<CareerWithScore | null>(null);
  const navigate = useNavigate();
  const { profile, updateProfile, addXp } = useAuth();
  const [savedCareers, setSavedCareers] = useState<number[]>([]);

  useEffect(() => {
    if (profile?.saved_careers) setSavedCareers(profile.saved_careers as number[]);
  }, [profile]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const careersWithScores = useMemo(() => {
    const stored = sessionStorage.getItem("careerScores");
    if (stored) {
      try { return JSON.parse(stored) as CareerWithScore[]; } catch { return undefined; }
    }
    const analysis = profile?.analysis_result;
    return CAREERS.map((career, i) => {
      const match = analysis?.topMatches?.find((m: { careerId: string; score: number; reason?: string }) => m.careerId === career.id);
      return {
        ...career,
        matchScore: match?.score || Math.max(20, Math.min(95, 95 - i * 0.3)),
        aiReason: match?.reason,
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  }, [profile]);

  // Only show top 10 careers
  const topCareers = useMemo(() => careersWithScores.slice(0, 10), [careersWithScores]);

  const handleSave = async (careerId: number) => {
    const newSaved = savedCareers.includes(careerId)
      ? savedCareers.filter(x => x !== careerId)
      : [...savedCareers, careerId];
    setSavedCareers(newSaved);
    await updateProfile({ saved_careers: newSaved });
    toast.success(newSaved.includes(careerId) ? "Career saved! 💾" : "Removed from saved");
  };

  const handleSelectCareer = async (career: CareerWithScore) => {
    const rankPosition = careersWithScores.findIndex((c) => c.id === career.id) + 1;
    const selectionEvent = {
      careerId: career.id,
      careerTitle: career.title,
      compassFitScore: career.matchScore,
      ruleScore: career.ruleScore,
      aiScore: career.aiScore,
      semanticScore: career.semanticScore,
      rankPosition: rankPosition || null,
      timestamp: new Date().toISOString(),
    };
    const updatedEvents = [...((profile?.career_selection_events as Array<Record<string, unknown>>) || []), selectionEvent].slice(-20);
    await updateProfile({
      selected_career_id: career.id,
      selected_career: { id: career.id, title: career.title, cat: career.cat, icon: career.icon, salaryRange: career.salaryRange },
      career_selection_events: updatedEvents,
    });
    await addXp(25, `Career set: ${career.title}`);
    toast.success(`Career set: ${career.title} 🎯`);
    setSelectedDetail(null);
    navigate("/roadmap");
  };

  const toggleCompare = (id: number) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 2) { toast.error("You can compare 2 careers at a time"); return prev; }
      return [...prev, id];
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-success";
    if (score >= 50) return "text-primary";
    return "text-muted-foreground";
  };

  const compareCareers = compareIds.map(id => careersWithScores.find((c) => c.id === id)).filter(Boolean) as CareerWithScore[];

  return (
    <PageTransition>
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 h-[52px] border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-full items-center justify-between px-6">
          <a href="/" className="text-lg font-bold text-foreground">AI Career Compass</a>
          <div className="flex items-center gap-3">
            <NotificationCenter />
            <a href="/quiz" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Quiz</a>
            <a href="/profile" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Profile</a>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 pt-[68px] pb-12">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Your Top 10 Career Matches</h1>
          <p className="text-sm text-muted-foreground mt-1">Click on any career to explore details, salary, and role description</p>
          {(profile?.analysis_result as { summary?: string })?.summary && (
            <p className="mt-2 text-sm text-primary">{(profile?.analysis_result as { summary?: string }).summary}</p>
          )}
          {!loading && topCareers.length > 0 && (
            <div className="mt-3">
              <ShareResultsCard
                topCareer={topCareers[0]}
                matchPercentage={Math.round(topCareers[0].matchScore)}
                userName={profile?.name || "Student"}
              />
            </div>
          )}
        </div>

        {/* Loading skeleton */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            {topCareers.map((career: CareerWithScore, i: number) => {
              const isSaved = savedCareers.includes(career.id);
              return (
              <motion.div key={career.id}
                variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
                whileHover={{ y: -4, borderColor: "hsl(var(--border-hover))" }}
                transition={{ duration: 0.2 }}
                onClick={() => setSelectedDetail(career)}
                className={`glass-card relative cursor-pointer ${i === 0 ? "glass-card--featured" : ""} ${compareIds.includes(career.id) ? "ring-2 ring-primary" : ""}`}>
                {i === 0 && (
                  <span className="absolute -top-2.5 left-4 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                    Top match
                  </span>
                )}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{career.icon}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{career.cat}</span>
                  </div>
                  <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                    <button onClick={() => toggleCompare(career.id)} title="Compare"
                      className={`transition-colors duration-200 rounded p-1 ${compareIds.includes(career.id) ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-primary"}`}>
                      <GitCompareArrows className="h-3.5 w-3.5" />
                    </button>
                    <motion.button onClick={() => handleSave(career.id)}
                      animate={isSaved ? { scale: [1, 1.4, 1] } : {}}
                      transition={{ duration: 0.3, type: "spring" }}
                      whileTap={{ scale: 1.3 }}>
                      <Heart className={`h-4 w-4 ${isSaved ? "fill-primary text-primary" : "text-muted-foreground hover:text-primary"}`} />
                    </motion.button>
                  </div>
                </div>

                {i === 0 && (
                  <motion.span initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400 }}
                    className="mt-2 inline-block rounded-full bg-warning/20 px-2 py-0.5 text-[10px] font-bold text-warning">🏆 Top Match</motion.span>
                )}
                {(i === 1 || i === 2) && <span className="mt-2 inline-block rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">⭐ Strong Match</span>}

                <h3 className="mt-2 text-lg font-semibold text-foreground">{career.title}</h3>

                <div className="mt-2 flex items-center gap-2">
                  <span className={`text-sm font-bold ${getScoreColor(career.matchScore)}`}>
                    <AnimatedNumber value={Math.round(career.matchScore)} duration={0.8} />%
                  </span>
                  <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                    <motion.div initial={{ width: 0 }} whileInView={{ width: `${career.matchScore}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: i * 0.05, ease: "easeOut" }}
                      className={`h-1.5 rounded-full ${career.matchScore >= 75 ? "bg-success" : career.matchScore >= 50 ? "bg-primary" : "bg-muted-foreground"}`} />
                  </div>
                </div>

                {career.aiReason && <p className="mt-2 text-xs text-primary italic line-clamp-2">{career.aiReason}</p>}
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{career.desc}</p>

                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{career.salaryRange}</span>
                  <span>{career.jobDemand} Demand</span>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs">
                  <div className="flex flex-wrap gap-1">
                    {career.skills?.slice(0, 2).map((s: string) => (
                      <span key={s} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{s}</span>
                    ))}
                  </div>
                  <span className="font-medium text-primary flex items-center gap-1">
                    View Details <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </motion.div>
              );
            })}
          </motion.div>
        )}

        {!loading && topCareers.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No results found. Please complete the quiz first.</p>
            <a href="/quiz" className="btn-primary mt-4 inline-block">Take Quiz →</a>
          </div>
        )}
      </div>

      {/* Compare floating bar */}
      <AnimatePresence>
        {compareIds.length > 0 && (
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-3 shadow-lg shadow-black/30">
            <GitCompareArrows className="h-4 w-4 text-primary" />
            <span className="text-sm text-foreground font-medium">{compareIds.length}/2 selected</span>
            {compareIds.length === 2 ? (
              <button onClick={() => setShowCompare(true)} className="btn-primary text-xs px-4 py-1.5">Compare Now</button>
            ) : (
              <span className="text-xs text-muted-foreground">Select one more</span>
            )}
            <button onClick={() => setCompareIds([])} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCompare && compareCareers.length === 2 && (
          <CompareModal careers={compareCareers} onClose={() => { setShowCompare(false); setCompareIds([]); }} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedDetail && (
          <CareerDetailModal career={selectedDetail} onClose={() => setSelectedDetail(null)} onSelect={handleSelectCareer} />
        )}
      </AnimatePresence>
    </div>
    </PageTransition>
  );
}
