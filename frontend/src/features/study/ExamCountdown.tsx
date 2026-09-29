import { useMemo } from "react";
import { motion } from "framer-motion";

// Real 2025-2026 exam dates for Indian entrance exams
const EXAM_DATES: Record<string, Date> = {
  "NEET": new Date("2026-05-04"),
  "JEE Main": new Date("2026-01-22"),
  "JEE Advanced": new Date("2026-05-18"),
  "UPSC CSE Prelims": new Date("2026-05-25"),
  "UPSC CSE": new Date("2026-05-25"),
  "UPSC": new Date("2026-05-25"),
  "GATE": new Date("2026-02-01"),
  "CAT": new Date("2026-11-24"),
  "CLAT": new Date("2026-12-01"),
  "CA Foundation": new Date("2026-06-01"),
  "CA Inter": new Date("2026-05-01"),
  "CA Final": new Date("2026-05-01"),
  "NIFT": new Date("2026-01-19"),
  "NDA": new Date("2026-04-13"),
  "BITSAT": new Date("2026-05-20"),
  "JEE": new Date("2026-01-22"),
  "CompTIA": new Date("2026-12-31"),
  "CEH": new Date("2026-12-31"),
  "NID": new Date("2026-01-15"),
  "CEED": new Date("2026-01-18"),
  "UCEED": new Date("2026-01-18"),
  "NATA": new Date("2026-04-10"),
};

interface ExamCountdownProps {
  career: { examPath?: string[] };
}

export default function ExamCountdown({ career }: ExamCountdownProps) {
  const relevantExams = useMemo(() => {
    if (!career?.examPath) return [];
    return career.examPath
      .map((exam: string) => {
        const date = EXAM_DATES[exam as keyof typeof EXAM_DATES];
        return date ? { name: exam, date } : null;
      })
      .filter((e): e is { name: string; date: Date } => e !== null && e.date > new Date())
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [career]);

  if (relevantExams.length === 0) return null;

  const nextExam = relevantExams[0];
  const daysLeft = Math.ceil((nextExam.date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isUrgent = daysLeft < 30;
  const isWarning = daysLeft < 60;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`rounded-xl border p-4 ${
        isUrgent
          ? "border-destructive/30 bg-destructive/5"
          : isWarning
          ? "border-warning/30 bg-warning/5"
          : "border-primary/30 bg-primary/5"
      }`}
    >
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
        Next Important Exam
      </div>
      <div className="text-sm font-bold text-foreground">{nextExam.name}</div>
      <div className="flex items-baseline gap-1 mt-2">
        <motion.span
          animate={isUrgent ? { scale: [1, 1.05, 1] } : {}}
          transition={{ repeat: isUrgent ? Infinity : 0, duration: 1.5 }}
          className={`text-3xl font-extrabold ${
            isUrgent ? "text-destructive" : isWarning ? "text-warning" : "text-primary"
          }`}
        >
          {daysLeft}
        </motion.span>
        <span className="text-xs text-muted-foreground">days left</span>
      </div>
      <div className="text-[10px] text-muted-foreground mt-1">
        {nextExam.date.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </div>

      {isWarning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`mt-3 rounded-lg px-3 py-2 text-[10px] ${
            isUrgent
              ? "bg-destructive/10 text-destructive"
              : "bg-warning/10 text-warning"
          }`}
        >
          ⚠️ Less than {isUrgent ? "30" : "60"} days! Focus on high-priority tasks.
        </motion.div>
      )}

      {/* Other upcoming exams */}
      {relevantExams.length > 1 && (
        <div className="mt-3 space-y-1">
          {relevantExams.slice(1, 3).map((exam: { name: string; date: Date }) => {
            const d = Math.ceil((exam.date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            return (
              <div key={exam.name} className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">{exam.name}</span>
                <span className="text-foreground font-medium">{d} days</span>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
