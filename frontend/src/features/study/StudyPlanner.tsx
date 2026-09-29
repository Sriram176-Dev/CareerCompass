import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { aiApi } from "@/services/api";
import { Loader2, Calendar } from "lucide-react";
import toast from "react-hot-toast";

interface StudySlot {
  time: string;
  task: string;
  resource?: string;
  xp: number;
}

interface WeeklyPlan {
  [day: string]: StudySlot[];
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function StudyPlanner() {
  const { profile } = useAuth();
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [tip, setTip] = useState("");

  const career = profile?.selected_career;

  const generateWeeklyPlan = async () => {
    if (!career) {
      toast.error("Select a career first");
      return;
    }
    setLoading(true);
    try {
      const data = await aiApi.careerTools("study-plan", {
        career: typeof career === 'string' ? career : career?.title,
        exam: (typeof career === 'object' && career?.examPath) ? career.examPath[0] : "",
        hoursPerDay: 4,
        level: "beginner",
        months: 6,
      });

      // If the edge function returns a study plan
      if (data?.weeklyPlan) {
        setWeeklyPlan(data.weeklyPlan);
        setTip(data.tip || "");
      } else {
        // Fallback: generate a sensible default plan
        const defaultPlan: WeeklyPlan = {};
        DAYS.forEach((day, i) => {
          if (i === 6) {
            defaultPlan[day] = [{ time: "Flexible", task: "Light review & revision", xp: 5 }];
          } else {
            defaultPlan[day] = [
              { time: "7:00-8:00 AM", task: `${career.title} fundamentals study`, xp: 15 },
              { time: "5:00-6:30 PM", task: "Practice problems & projects", xp: 20 },
            ];
          }
        });
        setWeeklyPlan(defaultPlan);
        setTip(`Consistency is key for ${career.title}. Try to study at the same time every day.`);
      }
      toast.success("Study plan generated! 📅");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate study plan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">📅 Weekly Study Plan</h3>
        </div>
        <motion.button
          onClick={generateWeeklyPlan}
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="btn-primary text-xs px-4 py-2 disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Generating...
            </span>
          ) : weeklyPlan ? "Regenerate" : "Generate Plan"}
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        {weeklyPlan ? (
          <motion.div
            key="plan"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="grid grid-cols-7 gap-1.5 overflow-x-auto">
              {DAYS.map(day => (
                <div key={day} className="min-w-[100px]">
                  <div className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    {day}
                  </div>
                  {(weeklyPlan[day] || []).map((slot, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="mb-1.5 rounded-lg border border-border bg-secondary p-2"
                    >
                      <div className="text-[10px] font-semibold text-primary">{slot.time}</div>
                      <div className="text-[10px] text-foreground mt-0.5 line-clamp-2">{slot.task}</div>
                      <div className="text-[9px] text-muted-foreground mt-0.5">+{slot.xp} XP</div>
                    </motion.div>
                  ))}
                </div>
              ))}
            </div>
            {tip && (
              <div className="mt-3 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2">
                <p className="text-xs text-primary">💡 {tip}</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <div className="text-3xl mb-2">📅</div>
            <p className="text-sm text-muted-foreground">
              Generate an AI-powered weekly study schedule tailored to your career goals
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
