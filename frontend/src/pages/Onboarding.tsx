import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import toast from "react-hot-toast";

const STEPS = ["Who are you?", "Your City", "Subjects", "Review"];

const userTypeCards = [
  { value: "school_student", label: "School Student", desc: "9th-12th grade", icon: "🎒" },
  { value: "college_student", label: "College Student", desc: "Undergraduate/Postgraduate", icon: "🎓" },
  { value: "self_learning", label: "Self-Learning", desc: "Independent learner", icon: "📚" },
  { value: "working", label: "Working Professional", desc: "Career switch/growth", icon: "💼" },
];

const boards = ["CBSE", "ICSE", "State Board", "IB"];
const cityTiers = [
  { value: "metro", label: "Metro", desc: "Delhi, Mumbai, Bangalore, Hyderabad, Chennai, Pune" },
  { value: "tier2", label: "Tier 2", desc: "Jaipur, Lucknow, Chandigarh, Kochi, Indore" },
  { value: "tier3", label: "Tier 3 / Rural", desc: "Smaller cities and towns" },
];

const subjects = [
  { key: "pcb", label: "PCB (Physics Chemistry Biology)" },
  { key: "pcm", label: "PCM (Physics Chemistry Maths)" },
  { key: "commerce", label: "Commerce & Accounts" },
  { key: "cs", label: "Computer Science" },
  { key: "arts", label: "Arts & Humanities" },
  { key: "sports", label: "Sports & Physical Education" },
];

// Infer interest cards from subject sliders for quiz pre-selection
function inferCardsFromSubjects(subjectValues: Record<string, number>): string[] {
  const cards: string[] = [];
  if ((subjectValues.pcb || 0) > 60) cards.push("biology", "lab-experiments", "helping-others");
  if ((subjectValues.pcm || 0) > 60) cards.push("mathematics", "fixing-things", "building-things");
  if ((subjectValues.cs || 0) > 60) cards.push("writing-code", "gaming", "analyzing-data");
  if ((subjectValues.commerce || 0) > 60) cards.push("managing-money", "commerce-accounts");
  if ((subjectValues.arts || 0) > 60) cards.push("drawing-art", "creative-writing", "acting-drama");
  if ((subjectValues.sports || 0) > 60) cards.push("sports-fitness");
  return cards;
}

export default function Onboarding() {
  const { user, updateProfile, addXp } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    user_type: "school_student",
    institution: "",
    current_class: "",
    board: "CBSE",
    city_tier: "metro",
    subjects: {} as Record<string, number>,
  });

  const handleComplete = async () => {
    if (!user) {
      toast.error("Please sign in first");
      navigate("/auth");
      return;
    }
    try {
      // Infer pre-selected interest cards from subject sliders
      const preSelectedCards = inferCardsFromSubjects(form.subjects);

      await updateProfile({
        user_type: form.user_type,
        institution: form.institution,
        current_class: form.current_class,
        board: form.board,
        city_tier: form.city_tier,
        subjects: form.subjects,
        onboarding_complete: true,
        interest_cards: preSelectedCards,
      });
      await addXp(50, "Onboarding complete!");

      // Store pre-selections in sessionStorage for Quiz page
      sessionStorage.setItem("preSelectedCards", JSON.stringify(preSelectedCards));

      toast.success("Profile set up! Let's discover your career 🎉");
      navigate("/quiz");
    } catch {
      toast.error("Failed to save profile");
    }
  };

  return (
    <PageTransition>
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl rounded-xl border border-border bg-card p-8">
        
        {/* Progress */}
        <div className="mb-6 flex gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={`h-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
              <p className={`mt-1 text-xs ${i <= step ? 'text-primary' : 'text-muted-foreground'}`}>{s}</p>
            </div>
          ))}
        </div>

        {/* Step 1: User Type */}
        {step === 0 && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4">Who are you?</h2>
            <div className="grid grid-cols-2 gap-3">
              {userTypeCards.map(t => (
                <button key={t.value} onClick={() => setForm(f => ({ ...f, user_type: t.value }))}
                  className={`rounded-xl border p-4 text-left transition-all duration-200 ${
                    form.user_type === t.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/30"
                  }`}>
                  <span className="text-2xl">{t.icon}</span>
                  <p className="mt-2 font-semibold text-foreground text-sm">{t.label}</p>
                  <p className="text-xs text-muted-foreground">{t.desc}</p>
                </button>
              ))}
            </div>
            {(form.user_type === "school_student" || form.user_type === "college_student") && (
              <div className="mt-4 space-y-3">
                <input type="text" placeholder="Institution name" value={form.institution}
                  onChange={e => setForm(f => ({ ...f, institution: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
                <input type="text" placeholder={form.user_type === "school_student" ? "Class (e.g., 11th)" : "Year (e.g., 2nd year B.Tech)"}
                  value={form.current_class} onChange={e => setForm(f => ({ ...f, current_class: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
                <div className="flex gap-2">
                  {boards.map(b => (
                    <button key={b} onClick={() => setForm(f => ({ ...f, board: b }))}
                      className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-200 ${
                        form.board === b ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                      }`}>{b}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: City */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4">Where are you based?</h2>
            <p className="text-sm text-muted-foreground mb-4">This helps us recommend location-relevant careers</p>
            <div className="space-y-3">
              {cityTiers.map(c => (
                <button key={c.value} onClick={() => setForm(f => ({ ...f, city_tier: c.value }))}
                  className={`w-full rounded-xl border p-4 text-left transition-all duration-200 ${
                    form.city_tier === c.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/30"
                  }`}>
                  <p className="font-semibold text-foreground text-sm">{c.label}</p>
                  <p className="text-xs text-muted-foreground">{c.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Subjects */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4">Subject Interests</h2>
            <p className="text-sm text-muted-foreground mb-4">Slide based on how much you enjoy or perform in this subject</p>
            <div className="space-y-5">
              {subjects.map(s => (
                <div key={s.key}>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm text-foreground">{s.label}</label>
                    <span className="text-xs text-primary font-semibold">{form.subjects[s.key] || 50}%</span>
                  </div>
                  <input type="range" min={0} max={100} value={form.subjects[s.key] || 50}
                    onChange={e => setForm(f => ({ ...f, subjects: { ...f.subjects, [s.key]: parseInt(e.target.value) } }))}
                    className="w-full accent-primary" />
                </div>
              ))}
              {/* Live preview of inferred interests */}
              {Object.values(form.subjects).some(v => (v as number) > 60) && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-primary/30 bg-primary/5 p-3 mt-2">
                  <p className="text-xs text-primary font-medium mb-1">🔮 Pre-selected quiz interests:</p>
                  <p className="text-xs text-muted-foreground">
                    {inferCardsFromSubjects(form.subjects).join(", ") || "Adjust sliders above 60% to pre-select"}
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4">Review Your Profile</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Type</span>
                <span className="text-foreground font-medium">{userTypeCards.find(t => t.value === form.user_type)?.label}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">City</span>
                <span className="text-foreground font-medium">{cityTiers.find(c => c.value === form.city_tier)?.label}</span>
              </div>
              {form.institution && (
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Institution</span>
                  <span className="text-foreground font-medium">{form.institution}</span>
                </div>
              )}
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Board</span>
                <span className="text-foreground font-medium">{form.board}</span>
              </div>
              <div className="mt-4">
                <p className="text-muted-foreground mb-2">Subject interests:</p>
                {subjects.map(s => (
                  <div key={s.key} className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground w-40">{s.label.split('(')[0]}</span>
                    <div className="h-1.5 flex-1 rounded-full bg-muted">
                      <div className="h-1.5 rounded-full bg-primary" style={{ width: `${form.subjects[s.key] || 50}%` }} />
                    </div>
                    <span className="text-xs text-primary w-8 text-right">{form.subjects[s.key] || 50}%</span>
                  </div>
                ))}
              </div>
              {inferCardsFromSubjects(form.subjects).length > 0 && (
                <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-3">
                  <p className="text-xs text-primary font-medium">✨ These interests will be pre-selected in the quiz:</p>
                  <p className="text-xs text-muted-foreground mt-1">{inferCardsFromSubjects(form.subjects).join(", ")}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          {step > 0 ? (
            <button onClick={() => setStep(s => s - 1)} className="btn-outline">← Back</button>
          ) : <div />}
          {step < 3 ? (
            <button onClick={() => setStep(s => s + 1)} className="btn-primary">Next →</button>
          ) : (
            <button onClick={handleComplete} className="btn-primary">Start Career Discovery →</button>
          )}
        </div>
      </motion.div>
    </div>
    </PageTransition>
  );
}
