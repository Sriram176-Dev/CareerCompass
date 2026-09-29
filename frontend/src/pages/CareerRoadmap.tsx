import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { AnimatedCheck, XpFloat } from "@/components/AnimatedComponents";
import { Clock, Circle, BookOpen, Target, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useBadges } from "@/hooks/useBadges";
import { aiApi } from "@/lib/api";
import RoadmapPulse from "@/features/roadmap/RoadmapPulse";
import { NOTIFICATION_TRIGGERS } from "@/components/NotificationCenter";
import toast from "react-hot-toast";

interface RoadmapData {
  milestones: Array<{
    id: string;
    title: string;
    description?: string;
    tasks: Array<{
      id: string;
      title: string;
      description?: string;
      xp?: number;
    }>;
  }>;
}

export default function Roadmap() {
  const { profile, updateProfile, addXp } = useAuth();
  const { checkBadges } = useBadges();
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedMilestones, setExpandedMilestones] = useState<string[]>([]);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [xpFloats, setXpFloats] = useState<{ id: number; xp: number }[]>([]);

  useEffect(() => {
    if (profile?.roadmap_data) setRoadmap(profile.roadmap_data);
    if (profile?.completed_tasks) setCompletedTasks(profile.completed_tasks as string[]);
  }, [profile]);

  const generateRoadmap = async () => {
    if (!profile?.selected_career) {
      toast.error("Select a career from Results page first");
      return;
    }
    setLoading(true);
    try {
      const data = await aiApi.generateRoadmap(profile.selected_career, profile);
      setRoadmap(data as RoadmapData);
      await updateProfile({ roadmap_data: data, roadmap_generated_at: new Date().toISOString() });
      toast.success("Roadmap generated! 🗺️");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate roadmap. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (taskId: string, taskXp: number = 25, taskTitle: string = "Task") => {
    const isCompleting = !completedTasks.includes(taskId);
    const newCompleted = isCompleting
      ? [...completedTasks, taskId]
      : completedTasks.filter(t => t !== taskId);
    setCompletedTasks(newCompleted);
    await updateProfile({ completed_tasks: newCompleted });
    if (isCompleting) {
      await addXp(taskXp, "Task completed!");
      setXpFloats(prev => [...prev, { id: Date.now(), xp: taskXp }]);
      NOTIFICATION_TRIGGERS.taskComplete(taskTitle, taskXp);
      roadmap?.milestones?.forEach((m) => {
        const mTasks = m.tasks || [];
        const allDone = mTasks.every((t) => newCompleted.includes(t.id));
        if (allDone && mTasks.length > 0) {
          addXp(200, `Milestone "${m.title}" completed! 🏆`);
          NOTIFICATION_TRIGGERS.milestoneComplete(m.title);
        }
      });
      setTimeout(() => checkBadges(), 500);
    }
  };

  const toggleMilestone = (id: string) => {
    setExpandedMilestones(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  const handleAcceptSupportTasks = async (supportTasks: Array<{ title: string; xp?: number; category?: string }>) => {
    if (!roadmap?.milestones?.length) return;
    const targetIdx = roadmap.milestones.findIndex((m) =>
      (m.tasks || []).some((t) => !completedTasks.includes(t.id))
    );
    const idx = targetIdx === -1 ? roadmap.milestones.length - 1 : targetIdx;

    const newTasks = supportTasks.map((t, i: number) => ({
      ...t,
      id: `catchup-${Date.now()}-${i}`,
      category: t.category || "catch-up",
    }));

    const updatedMilestones = roadmap.milestones.map((m, i: number) =>
      i === idx ? { ...m, tasks: [...(m.tasks || []), ...newTasks] } : m
    );
    const updatedRoadmap = { ...roadmap, milestones: updatedMilestones };
    setRoadmap(updatedRoadmap);
    await updateProfile({ roadmap_data: updatedRoadmap });
    toast.success("Added catch-up tasks to your roadmap 🎯");
  };

  const career = profile?.selected_career as { icon: string; title: string; cat: string; salaryRange: string } | undefined;
  const milestones = roadmap?.milestones || [];
  const totalTasks = milestones.reduce((sum: number, m) => sum + (m.tasks?.length || 0), 0);
  const doneTasks = milestones.reduce((sum: number, m) => sum + (m.tasks?.filter((t) => completedTasks.includes(t.id)).length || 0), 0);
  const progress = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

  if (!career) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center py-20 px-6">
          <Target className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold text-foreground">No career selected</h2>
          <p className="mt-2 text-sm text-muted-foreground">Complete the quiz and select a career to generate your roadmap</p>
          <a href="/quiz" className="btn-primary mt-4 inline-block">Start Quiz →</a>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="w-full max-w-5xl mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Career Overview */}
          <div className="glass-card mb-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{career.icon}</span>
              <div>
                <h1 className="text-xl font-bold text-foreground">{career.title}</h1>
                <p className="text-sm text-muted-foreground">{career.cat} • {career.salaryRange}</p>
              </div>
            </div>
            {roadmap?.overview && <p className="text-sm text-muted-foreground mb-4">{roadmap.overview}</p>}
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div className="rounded-lg bg-muted p-3"><span className="text-muted-foreground text-xs">Progress</span><p className="font-semibold text-primary">{progress}%</p></div>
              <div className="rounded-lg bg-muted p-3"><span className="text-muted-foreground text-xs">Tasks</span><p className="font-semibold text-foreground">{doneTasks}/{totalTasks}</p></div>
              <div className="rounded-lg bg-muted p-3"><span className="text-muted-foreground text-xs">Level</span><p className="font-semibold text-foreground">{profile?.level || 1}</p></div>
              <div className="rounded-lg bg-muted p-3"><span className="text-muted-foreground text-xs">XP</span><p className="font-semibold text-primary">{profile?.xp || 0}</p></div>
            </div>
          </div>

          {roadmap && (
            <RoadmapPulse
              career={career}
              roadmap={roadmap}
              roadmapGeneratedAt={profile?.roadmap_generated_at}
              doneTasks={doneTasks}
              totalTasks={totalTasks}
              completedTaskIds={completedTasks}
              quizAttempts={(profile?.quiz_attempts as Array<{ category: string; score: number; total: number; difficulty: string; timestamp: string }>) || []}
              onAcceptSupportTasks={handleAcceptSupportTasks}
            />
          )}

          {/* Salary Journey */}
          {roadmap?.salaryJourney && (
            <div className="glass-card mb-6">
              <h3 className="font-semibold text-foreground mb-3">💰 Salary Journey</h3>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(roadmap.salaryJourney).map(([key, val]: [string, string]) => (
                  <div key={key} className="rounded-lg bg-muted p-3 text-center">
                    <p className="text-xs text-muted-foreground capitalize">{key}</p>
                    <p className="text-sm font-bold text-foreground">{val}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!roadmap ? (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">Generate your AI-powered roadmap with India-specific resources</p>
              <button onClick={generateRoadmap} disabled={loading} className="btn-primary disabled:opacity-50">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Generating with AI...
                  </span>
                ) : "Generate AI Roadmap"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* XP Floats */}
              <div className="relative">
                <AnimatePresence>
                  {xpFloats.map(f => (
                    <XpFloat key={f.id} xp={f.xp} onDone={() => setXpFloats(prev => prev.filter(x => x.id !== f.id))} />
                  ))}
                </AnimatePresence>
              </div>

              {milestones.map((milestone, i: number) => {
                const isExpanded = expandedMilestones.includes(milestone.id);
                const mTasks = milestone.tasks || [];
                const mDone = mTasks.filter((t) => completedTasks.includes(t.id)).length;
                const mComplete = mTasks.length > 0 && mDone === mTasks.length;
                const isActive = !mComplete && i === milestones.findIndex((m) => !(m.tasks || []).every((t) => completedTasks.includes(t.id)));
                return (
                  <motion.div key={milestone.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="relative pl-8"
                  >
                    {i < milestones.length - 1 && (
                      <motion.div initial={{ height: 0 }} animate={{ height: "100%" }} transition={{ duration: 0.5, delay: i * 0.1 }}
                        className="absolute left-3 top-6 w-px bg-border" />
                    )}
                    <div className={`absolute left-0 top-3 h-6 w-6 rounded-full flex items-center justify-center ${mComplete ? 'bg-success' : ''}`}
                      style={{ backgroundColor: mComplete ? undefined : (milestone.color || 'hsl(var(--primary))') }}>
                      {mComplete ? <AnimatedCheck size={16} /> : <span className="text-xs font-bold text-primary-foreground">{i + 1}</span>}
                      {isActive && (
                        <motion.div animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }} transition={{ duration: 2, repeat: Infinity }}
                          className="absolute inset-0 rounded-full border-2 border-primary" />
                      )}
                    </div>

                    <div className="glass-card">
                      <button onClick={() => toggleMilestone(milestone.id)} className="w-full text-left">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-foreground">{milestone.title}</h3>
                            <p className="text-sm text-muted-foreground">{milestone.subtitle}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{mDone}/{mTasks.length}</span>
                            <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </motion.div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{milestone.duration}</span>
                          <div className="flex-1 h-1 rounded-full bg-muted ml-2 overflow-hidden">
                            <motion.div className="h-1 rounded-full bg-primary"
                              initial={{ width: 0 }} animate={{ width: `${mTasks.length ? (mDone / mTasks.length) * 100 : 0}%` }}
                              transition={{ duration: 0.5 }} />
                          </div>
                        </div>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }} className="overflow-hidden">
                            <div className="mt-4 space-y-2">
                              {mTasks.map((task: { id: string; title: string; description?: string; xp?: number; priority?: string; resource?: string }) => {
                                const isCompleted = completedTasks.includes(task.id);
                                return (
                                  <motion.div key={task.id} whileHover={{ borderColor: "hsl(0 0% 16.5%)" }}
                                    className="relative flex items-start gap-3 rounded-lg border border-border p-3">
                                    <button onClick={() => toggleTask(task.id, task.xp || 25, task.title)} className="mt-0.5">
                                      {isCompleted ? <AnimatedCheck size={20} /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                                    </button>
                                    <div className="flex-1">
                                      <p className={`text-sm font-medium ${isCompleted ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.title}</p>
                                      <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                                      <div className="mt-1 flex flex-wrap items-center gap-2">
                                        <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] text-primary font-medium">{task.xp || 25} XP</span>
                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                          task.priority === 'high' ? 'bg-destructive/20 text-destructive' :
                                          task.priority === 'medium' ? 'bg-warning/20 text-warning' : 'bg-muted text-muted-foreground'
                                        }`}>{task.priority}</span>
                                        {task.resource && (
                                          <a href={task.resource.startsWith('http') ? task.resource : `https://www.google.com/search?q=${encodeURIComponent(task.resource)}`}
                                            target="_blank" rel="noopener" className="text-[10px] text-primary hover:underline">
                                            📖 {task.resource.length > 30 ? task.resource.slice(0, 30) + '...' : task.resource}
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  </motion.div>
                                );
                              })}
                              {milestone.capstone && (
                                <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3">
                                  <p className="text-xs font-semibold text-primary">🎯 Capstone Project</p>
                                  <p className="text-xs text-muted-foreground mt-1">{milestone.capstone}</p>
                                </div>
                              )}
                              {milestone.outcome && (
                                <p className="text-xs text-success italic">📈 {milestone.outcome}</p>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}

              {/* Indian Resources */}
              {roadmap?.indianResources && (
                <div className="glass-card mt-6">
                  <h3 className="font-semibold text-foreground mb-3">📚 Indian Resources</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {roadmap.indianResources.freeWebsites?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Free Websites</p>
                        {roadmap.indianResources.freeWebsites.map((s: string) => <p key={s} className="text-xs text-muted-foreground">• {s}</p>)}
                      </div>
                    )}
                    {roadmap.indianResources.youtubeChannels?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">YouTube Channels</p>
                        {roadmap.indianResources.youtubeChannels.map((s: string) => <p key={s} className="text-xs text-muted-foreground">• {s}</p>)}
                      </div>
                    )}
                    {roadmap.indianResources.books?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Books</p>
                        {roadmap.indianResources.books.map((s: string) => <p key={s} className="text-xs text-muted-foreground">• {s}</p>)}
                      </div>
                    )}
                    {roadmap.indianResources.onlineCourses?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Online Courses</p>
                        {roadmap.indianResources.onlineCourses.map((s: string) => <p key={s} className="text-xs text-muted-foreground">• {s}</p>)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Top Recruiters & Common Mistakes */}
              <div className="grid gap-4 sm:grid-cols-2">
                {roadmap?.topRecruiters?.length > 0 && (
                  <div className="glass-card">
                    <h3 className="font-semibold text-foreground mb-2 text-sm">🏢 Top Recruiters</h3>
                    <div className="flex flex-wrap gap-1">
                      {roadmap.topRecruiters.map((c: string) => (
                        <span key={c} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{c}</span>
                      ))}
                    </div>
                  </div>
                )}
                {roadmap?.commonMistakes?.length > 0 && (
                  <div className="glass-card">
                    <h3 className="font-semibold text-foreground mb-2 text-sm">⚠️ Common Mistakes</h3>
                    {roadmap.commonMistakes.map((m: string, i: number) => (
                      <p key={i} className="text-xs text-muted-foreground mb-1">• {m}</p>
                    ))}
                  </div>
                )}
              </div>

              {/* Daily Habits */}
              {roadmap?.dailyHabits?.length > 0 && (
                <div className="glass-card">
                  <h3 className="font-semibold text-foreground mb-3">📅 Daily Habits</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {roadmap.dailyHabits.map((h: { habit: string; duration: string; tool: string }, i: number) => (
                      <div key={i} className="rounded-lg border border-border bg-muted p-3">
                        <p className="text-xs font-medium text-foreground">{h.habit}</p>
                        <p className="text-[10px] text-muted-foreground">{h.duration} • {h.tool}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </PageTransition>
  );
}
