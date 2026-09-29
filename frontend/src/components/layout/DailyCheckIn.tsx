import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

interface ProfileWithCheckIn {
  last_check_in?: string;
  streak?: number;
}

export default function DailyCheckIn() {
  const { profile, user, addXp, refreshProfile, updateProfile } = useAuth();
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [claimed, setClaimed] = useState(false);

  const today = new Date().toDateString();
  const lastCheckIn = (profile as ProfileWithCheckIn)?.last_check_in;
  const streak = (profile as ProfileWithCheckIn)?.streak || 0;
  const isFirstVisitToday = lastCheckIn !== today;

  // Check if previous day was consecutive
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isConsecutive = lastCheckIn === yesterday.toDateString();

  useEffect(() => {
    if (profile && isFirstVisitToday && user) {
      const timer = setTimeout(() => setShowCheckIn(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [profile, isFirstVisitToday, user]);

  const handleCheckIn = async () => {
    if (!user) return;
    const newStreak = isConsecutive ? streak + 1 : 1;
    const bonusXP = Math.min(newStreak * 5, 50);
    const totalXP = 10 + bonusXP;

    if (updateProfile) {
      await updateProfile({ last_check_in: today, streak: newStreak });
    }

    await addXp(totalXP, `Daily check-in! ${newStreak} day streak 🔥`);
    setClaimed(true);
    setTimeout(() => {
      setShowCheckIn(false);
      refreshProfile();
    }, 1200);
  };

  if (!isFirstVisitToday || !user) return null;

  return (
    <AnimatePresence>
      {showCheckIn && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed bottom-6 left-6 z-[100] max-w-[280px] rounded-2xl border border-border bg-card p-5 shadow-2xl shadow-black/40"
        >
          <div className="text-3xl mb-2">
            {streak >= 7 ? "🔥" : streak >= 3 ? "⭐" : "👋"}
          </div>
          <h4 className="text-base font-bold text-foreground mb-1">
            Day {(isConsecutive ? streak + 1 : 1)} Check-in!
          </h4>
          <p className="text-xs text-muted-foreground mb-4">
            {streak >= 7
              ? `Amazing ${streak}-day streak! You're on fire!`
              : streak >= 3
              ? `${streak} day streak. Keep going!`
              : "Start your streak today!"}
          </p>

          {/* 7-day streak display */}
          <div className="flex gap-1.5 mb-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.05, type: "spring", stiffness: 400, damping: 20 }}
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  i < streak
                    ? "bg-primary text-primary-foreground"
                    : i === streak && isFirstVisitToday
                    ? "border-2 border-primary/50 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i < streak ? "✓" : i + 1}
              </motion.div>
            ))}
          </div>

          {!claimed ? (
            <motion.button
              onClick={handleCheckIn}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="btn-primary w-full text-sm"
            >
              Claim +{10 + Math.min((isConsecutive ? streak + 1 : 1) * 5, 50)} XP 🎁
            </motion.button>
          ) : (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="text-center text-sm font-bold text-success"
            >
              ✅ Claimed!
            </motion.div>
          )}

          <button
            onClick={() => setShowCheckIn(false)}
            className="mt-2 w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Dismiss
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
