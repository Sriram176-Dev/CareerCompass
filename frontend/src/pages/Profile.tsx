import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Award, BookOpen, Zap, Target, Star, LogOut, Download, FileText, RefreshCw } from "lucide-react";
import { CopyButton } from "@/components/MicroInteractions";
import PageTransition from "@/components/PageTransition";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useBadges } from "@/hooks/useBadges";
import { aiApi } from "@/lib/api";
import NotificationCenter from "@/components/NotificationCenter";
import ProgressAnalytics from "@/components/ProgressAnalytics";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { CAREERS } from "@/data/careers";


export default function Profile() {
  const { profile, signOut, addXp, updateProfile } = useAuth();
  const { earnedBadges, checkBadges, allBadges } = useBadges();
  const navigate = useNavigate();
  const [resumeData, setResumeData] = useState<Record<string, unknown> | null>(null);
  const [generatingResume, setGeneratingResume] = useState(false);
  const [switchingCareer, setSwitchingCareer] = useState(false);

  const xp = profile?.xp || 0;
  const level = profile?.level || 1;
  const xpInLevel = xp % 150;
  const completedCount = (profile?.completed_tasks as string[] || []).length;
  const career = profile?.selected_career;
  const savedCareers = (profile?.saved_careers || []) as number[];

  const badgeTargets: Record<string, { current: number; target: number; unit: string }> = {
    first_steps: { current: completedCount, target: 1, unit: "tasks" },
    on_fire: { current: xp, target: 100, unit: "XP" },
    rising_star: { current: xp, target: 500, unit: "XP" },
    diamond: { current: xp, target: 1000, unit: "XP" },
    sharpshooter: { current: completedCount, target: 10, unit: "tasks" },
    scholar: { current: completedCount, target: 25, unit: "tasks" },
    champion: { current: level, target: 10, unit: "level" },
    legend: { current: xp, target: 5000, unit: "XP" },
  };

  const badges = allBadges.map(b => {
    const earned = earnedBadges.includes(b.id);
    const t = badgeTargets[b.id] || { current: 0, target: 1, unit: "" };
    const progress = earned ? 1 : Math.min(t.current / t.target, 1);
    const tooltip = earned ? `✅ Unlocked!` : `${Math.min(t.current, t.target)}/${t.target} ${t.unit}`;
    return { ...b, earned, desc: b.description, progress, tooltip };
  });

  // Check badges on profile load
  useEffect(() => { checkBadges(); }, [checkBadges]);

  const handleGenerateResume = async () => {
    if (!career) { toast.error("Select a career first"); return; }
    setGeneratingResume(true);
    try {
      const careerData = CAREERS.find(c => c.id === career.id);
      const data = await aiApi.generateResume({
        userProfile: profile,
        completedTasks: profile?.completed_tasks,
        career,
      });
      setResumeData(data);
      toast.success("Resume generated! 📄");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate resume. Please try again.");
    } finally {
      setGeneratingResume(false);
    }
  };

  const resumeText = resumeData ? (() => {
    const skills = resumeData.technicalSkills;
    const skillsText = typeof skills === 'object' && !Array.isArray(skills)
      ? `Primary: ${(skills as { primary?: string[] })?.primary?.join(", ")}\nTools: ${(skills as { tools?: string[] })?.tools?.join(", ")}\nLearning: ${(skills as { learning?: string[] })?.learning?.join(", ")}`
      : `${(skills || []).join(", ")}`;
    return `RESUME — ${profile?.name}\n\n${resumeData.summary}\n\nObjective: ${resumeData.objective}\n\nTechnical Skills:\n${skillsText}\n\nSoft Skills: ${resumeData.softSkills?.join(", ")}\n\nProjects:\n${resumeData.projects?.map((p: { title: string; description: string }) => `• ${p.title}: ${p.description}`).join("\n")}\n\nAchievements:\n${resumeData.achievements?.map((a: string) => `• ${a}`).join("\n")}\n\nATS Keywords: ${resumeData.keywordsForATS?.join(", ")}\n\n${resumeData.coverLetterTemplate ? `Cover Letter Template:\n${resumeData.coverLetterTemplate}` : ''}`;
  })() : "";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <PageTransition>
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 h-[52px] border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-full items-center justify-between px-6">
          <a href="/" className="text-lg font-bold text-foreground">AI Career Compass</a>
          <div className="flex items-center gap-3">
            <NotificationCenter />
            <a href="/roadmap" className="text-sm text-text-secondary hover:text-foreground transition-colors">Roadmap</a>
            <button onClick={handleSignOut} className="flex items-center gap-1 text-sm text-text-secondary hover:text-foreground transition-colors">
              <LogOut className="h-3.5 w-3.5" /> Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto max-w-3xl px-6 pt-[68px] pb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Profile Header */}
          <div className="glass-card flex items-center gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
              {profile?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">{profile?.name || "Student"}</h1>
              <p className="text-sm text-text-secondary">{profile?.user_type?.replace('_', ' ') || "Student"} {profile?.institution ? `• ${profile.institution}` : ''}</p>
              <p className="mt-1 text-xs text-text-muted">{profile?.email} {profile?.city_tier ? `• ${profile.city_tier}` : ''}</p>
              {career && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm">{career.icon}</span>
                  <span className="text-sm text-primary font-medium">{career.title}</span>
                </div>
              )}
            </div>
          </div>

          {/* Switch Career */}
          <div className="mt-4 glass-card flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-primary" />
                Switch Career Path
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {career ? "Retake the quiz to discover a new career that fits you better" : "Take the career discovery quiz to find your ideal path"}
              </p>
            </div>
            <button
              onClick={async () => {
                setSwitchingCareer(true);
                try {
                  await updateProfile({
                    selected_career: null,
                    selected_career_id: null,
                    analysis_result: null,
                    interest_cards: [],
                    priority_ranking: [],
                    roadmap_data: null,
                  });
                  sessionStorage.removeItem("preSelectedCards");
                  toast.success("Let's find your new career path! 🚀");
                  navigate("/quiz");
                } catch {
                  toast.error("Something went wrong");
                } finally {
                  setSwitchingCareer(false);
                }
              }}
              disabled={switchingCareer}
              className="btn-outline text-xs px-4 py-2 flex items-center gap-1.5 shrink-0"
            >
              {switchingCareer ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              {career ? "Switch Career" : "Take Quiz"}
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { icon: Zap, label: "Total XP", value: xp },
              { icon: Target, label: "Tasks Done", value: completedCount },
              { icon: Award, label: "Badges", value: badges.filter(b => b.earned).length },
              { icon: Star, label: "Level", value: level },
            ].map(stat => (
              <div key={stat.label} className="glass-card text-center">
                <stat.icon className="mx-auto h-5 w-5 text-primary mb-1" />
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-text-muted">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Level Progress */}
          <div className="mt-6 glass-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-foreground">Level {level}</span>
              <span className="text-xs text-text-muted">{xpInLevel}/150 XP to Level {level + 1}</span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <motion.div initial={{ width: 0 }} animate={{ width: `${(xpInLevel / 150) * 100}%` }}
                transition={{ duration: 1 }} className="h-2 rounded-full bg-primary" />
            </div>
          </div>

          {/* Personality Type */}
          {profile?.analysis_result?.personalityType && (
            <div className="mt-6 glass-card text-center">
              <p className="text-xs text-text-muted mb-1">Your Career Personality</p>
              <p className="text-xl font-bold text-primary">{profile.analysis_result.personalityType}</p>
              {profile.analysis_result.topCareerMessage && (
                <p className="mt-2 text-sm text-text-secondary italic">{profile.analysis_result.topCareerMessage}</p>
              )}
            </div>
          )}

          {/* Interest Cards */}
          {(profile?.interest_cards as string[] || []).length > 0 && (
            <div className="mt-6 glass-card">
              <h2 className="font-semibold text-foreground mb-3">Your Interests</h2>
              <div className="flex flex-wrap gap-2">
                {(profile?.interest_cards as string[]).map(card => (
                  <span key={card} className="rounded-pill bg-primary/10 border border-primary/30 px-3 py-1 text-xs text-primary">{card}</span>
                ))}
              </div>
            </div>
          )}

          {/* Badges */}
          <div className="mt-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Achievements</h2>
            <TooltipProvider delayDuration={200}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {badges.map(badge => (
                  <Tooltip key={badge.name}>
                    <TooltipTrigger asChild>
                      <div className={`glass-card text-center py-4 transition-all duration-300 cursor-default ${badge.earned ? 'ring-1 ring-primary/30' : 'opacity-60 grayscale'}`}>
                        <span className={`text-2xl ${badge.earned ? 'animate-bounce' : ''}`}>{badge.icon}</span>
                        <p className="mt-1 text-xs font-medium text-foreground">{badge.name}</p>
                        <p className="text-[10px] text-text-muted mb-2">{badge.desc}</p>
                        <div className="mx-3 h-1.5 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${badge.progress * 100}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className={`h-full rounded-full ${badge.earned ? 'bg-primary' : 'bg-primary/50'}`}
                          />
                        </div>
                        <p className="mt-1 text-[10px] text-text-muted">{badge.earned ? '✅ Unlocked' : `${Math.round(badge.progress * 100)}%`}</p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs font-medium">
                      {badge.tooltip}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>
          </div>

          {/* Resume Builder */}
          <div className="mt-6 glass-card">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="h-6 w-6 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">AI Resume Builder</h2>
            </div>
            {!resumeData ? (
              <div className="text-center">
                <p className="text-sm text-text-secondary mb-4">Generate a professional resume from your completed roadmap tasks and skills</p>
                <button onClick={handleGenerateResume} disabled={generatingResume || !career} className="btn-primary disabled:opacity-50">
                  {generatingResume ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      Generating with AI...
                    </span>
                  ) : "Generate Resume"}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg bg-muted p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-1">Professional Summary</h3>
                  <p className="text-xs text-text-secondary">{resumeData.summary}</p>
                </div>
                <div className="rounded-lg bg-muted p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-1">Career Objective</h3>
                  <p className="text-xs text-text-secondary">{resumeData.objective}</p>
                </div>
                {resumeData.technicalSkills && (
                  <div className="rounded-lg bg-muted p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-2">Technical Skills</h3>
                    <div className="space-y-2">
                      {typeof resumeData.technicalSkills === 'object' && !Array.isArray(resumeData.technicalSkills) ? (
                        <>
                          {resumeData.technicalSkills.primary && (
                            <div><p className="text-[10px] text-text-muted mb-1">Primary</p><div className="flex flex-wrap gap-1">{resumeData.technicalSkills.primary.map((s: string) => (<span key={s} className="rounded-pill bg-primary/20 px-2 py-0.5 text-[10px] text-primary">{s}</span>))}</div></div>
                          )}
                          {resumeData.technicalSkills.tools && (
                            <div><p className="text-[10px] text-text-muted mb-1">Tools</p><div className="flex flex-wrap gap-1">{resumeData.technicalSkills.tools.map((s: string) => (<span key={s} className="rounded-pill bg-muted px-2 py-0.5 text-[10px] text-text-secondary">{s}</span>))}</div></div>
                          )}
                        </>
                      ) : (
                        <div className="flex flex-wrap gap-1">{(resumeData.technicalSkills || []).map((s: string) => (<span key={s} className="rounded-pill bg-primary/20 px-2 py-0.5 text-[10px] text-primary">{s}</span>))}</div>
                      )}
                    </div>
                  </div>
                )}
                {resumeData.projects?.length > 0 && (
                  <div className="rounded-lg bg-muted p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-2">Projects</h3>
                    {resumeData.projects.map((p: { title: string; description: string; technologies?: string[] }, i: number) => (
                      <div key={i} className="mb-2">
                        <p className="text-xs font-medium text-foreground">{p.title}</p>
                        <p className="text-xs text-text-secondary">{p.description}</p>
                        {p.technologies && <p className="text-[10px] text-text-muted mt-0.5">Tech: {p.technologies.join(", ")}</p>}
                      </div>
                    ))}
                  </div>
                )}
                {resumeData.achievements?.length > 0 && (
                  <div className="rounded-lg bg-muted p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-2">Achievements</h3>
                    {resumeData.achievements.map((a: string, i: number) => (
                      <p key={i} className="text-xs text-text-secondary mb-1">✅ {a}</p>
                    ))}
                  </div>
                )}
                {resumeData.resumeTips?.length > 0 && (
                  <div className="rounded-lg bg-muted p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-2">💡 Resume Tips for India</h3>
                    {resumeData.resumeTips.map((t: string, i: number) => (
                      <p key={i} className="text-xs text-text-secondary mb-1">• {t}</p>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <CopyButton text={resumeText} label="Copy Full Resume" />
                  <button onClick={handleGenerateResume} className="btn-outline flex items-center gap-2 text-sm">
                    Regenerate
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Saved Careers */}
          {savedCareers.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Saved Careers</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {savedCareers.map(id => {
                  const c = CAREERS.find(c => c.id === id);
                  if (!c) return null;
                  return (
                    <div key={id} className="glass-card flex items-center gap-3">
                      <span className="text-2xl">{c.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">{c.title}</p>
                        <p className="text-xs text-text-secondary">{c.salaryRange}</p>
                      </div>
                      <a href="/roadmap" className="text-xs text-primary hover:underline">View →</a>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* Progress Analytics */}
          <ProgressAnalytics />

        </motion.div>
      </div>
    </div>
    </PageTransition>
  );
}
