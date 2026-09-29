import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { Timer, Play, Pause, RotateCcw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const POMODORO_MODES = {
  work: { label: "Focus", duration: 25 * 60, color: "text-primary" },
  short: { label: "Short Break", duration: 5 * 60, color: "text-success" },
  long: { label: "Long Break", duration: 15 * 60, color: "text-warning" },
} as const;

type PomodoroMode = keyof typeof POMODORO_MODES;

export default function Pomodoro() {
  const { profile, addXp, updateProfile } = useAuth();
  const [pomodoroMode, setPomodoroMode] = useState<PomodoroMode>("work");
  const [pomodoroTime, setPomodoroTime] = useState(POMODORO_MODES.work.duration);
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroSessions, setPomodoroSessions] = useState(0);
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(0);

  // Load persisted stats from profile
  useEffect(() => {
    if (profile) {
      setPomodoroSessions((profile as { pomodoro_sessions?: number }).pomodoro_sessions || 0);
      setTotalFocusMinutes((profile as { total_focus_minutes?: number }).total_focus_minutes || 0);
    }
  }, [profile]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!pomodoroActive) return;
    const interval = setInterval(() => {
      setPomodoroTime(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setPomodoroActive(false);
          if (pomodoroMode === "work") {
            const newSessions = pomodoroSessions + 1;
            const newMinutes = totalFocusMinutes + 25;
            setPomodoroSessions(newSessions);
            setTotalFocusMinutes(newMinutes);
            // Persist to database
            updateProfile({ pomodoro_sessions: newSessions, total_focus_minutes: newMinutes });
            addXp(15, "Focus session complete! 🍅");
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("🍅 Focus session complete!", { body: "Great work! Time for a break." });
            }
            const nextMode = newSessions % 4 === 0 ? "long" : "short";
            setPomodoroMode(nextMode);
            return POMODORO_MODES[nextMode].duration;
          } else {
            setPomodoroMode("work");
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("☕ Break's over!", { body: "Ready for another focus session?" });
            }
            return POMODORO_MODES.work.duration;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [pomodoroActive, pomodoroMode, pomodoroSessions, totalFocusMinutes, updateProfile, addXp]);

  const switchPomodoroMode = (mode: PomodoroMode) => {
    setPomodoroActive(false);
    setPomodoroMode(mode);
    setPomodoroTime(POMODORO_MODES[mode].duration);
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const progress = ((POMODORO_MODES[pomodoroMode].duration - pomodoroTime) / POMODORO_MODES[pomodoroMode].duration) * 100;

  return (
    <PageTransition>
      <div className="w-full max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
          <span className="icon-box icon-box-destructive h-9 w-9 rounded-lg"><Timer className="h-5 w-5" /></span>
          Pomodoro Timer
        </h1>
        <p className="text-sm text-muted-foreground mb-8">Stay focused with timed work sessions and earn XP</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left — Timer */}
          <div className="glass-card text-center flex flex-col items-center justify-center">
            <Timer className={`h-8 w-8 mb-3 ${POMODORO_MODES[pomodoroMode].color}`} />
            <p className="text-sm text-muted-foreground mb-4">{POMODORO_MODES[pomodoroMode].label}</p>

            {/* Circular progress */}
            <div className="relative w-56 h-56 mb-6">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
                <circle
                  cx="50" cy="50" r="45" fill="none"
                  stroke="hsl(var(--primary))" strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-5xl font-bold text-foreground font-mono">{formatTime(pomodoroTime)}</span>
              </div>
            </div>

            {/* Mode switcher */}
            <div className="flex gap-2 mb-4 w-full max-w-sm">
              {(Object.keys(POMODORO_MODES) as PomodoroMode[]).map(mode => (
                <button key={mode} onClick={() => switchPomodoroMode(mode)}
                  className={`flex-1 rounded-lg py-2 text-xs font-medium transition-all ${
                    pomodoroMode === mode ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground"
                  }`}>
                  {mode === "work" ? "🍅" : mode === "short" ? "☕" : "🌴"} {POMODORO_MODES[mode].label}
                </button>
              ))}
            </div>

            {/* Controls */}
            <div className="flex gap-3 w-full max-w-sm">
              <button onClick={() => setPomodoroActive(!pomodoroActive)}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-medium ${
                  pomodoroActive ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"
                }`}>
                {pomodoroActive ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4" /> Start</>}
              </button>
              <button onClick={() => switchPomodoroMode(pomodoroMode)}
                className="rounded-lg border border-border px-4 py-3 text-muted-foreground hover:text-foreground">
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Right — Stats & Info */}
          <div className="space-y-4">
            {/* Session Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="glass-card text-center">
                <p className="text-3xl font-bold text-foreground">{pomodoroSessions}</p>
                <p className="text-xs text-muted-foreground mt-1">Sessions</p>
              </div>
              <div className="glass-card text-center">
                <p className="text-3xl font-bold text-foreground">{totalFocusMinutes}m</p>
                <p className="text-xs text-muted-foreground mt-1">Focus Time</p>
              </div>
              <div className="glass-card text-center">
                <p className="text-3xl font-bold text-primary">{profile?.xp || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Total XP</p>
              </div>
            </div>

            {/* How it works */}
            <div className="glass-card">
              <h3 className="font-semibold text-foreground mb-3">📖 How it works</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">1</span>
                  <p className="text-sm text-muted-foreground">Focus for 25 minutes on your task</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/20 text-xs font-bold text-success">2</span>
                  <p className="text-sm text-muted-foreground">Take a 5-minute short break</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-warning/20 text-xs font-bold text-warning">3</span>
                  <p className="text-sm text-muted-foreground">After 4 sessions, take a 15-minute long break</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">⚡</span>
                  <p className="text-sm text-muted-foreground">Earn <span className="text-primary font-medium">15 XP</span> for each focus session</p>
                </div>
              </div>
            </div>

            {/* Session history */}
            <div className="glass-card">
              <h3 className="font-semibold text-foreground mb-3">📊 All-Time Progress</h3>
              {pomodoroSessions > 0 ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sessions completed</span>
                    <span className="text-foreground font-medium">{pomodoroSessions}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total focus time</span>
                    <span className="text-foreground font-medium">{totalFocusMinutes}m</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">XP earned from focus</span>
                    <span className="text-primary font-medium">{pomodoroSessions * 15} XP</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted mt-2 overflow-hidden">
                    <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${Math.min((pomodoroSessions / 50) * 100, 100)}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground text-right">{pomodoroSessions}/50 lifetime goal</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Start your first session to see progress here</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
