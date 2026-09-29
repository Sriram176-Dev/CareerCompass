import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell } from "lucide-react";
import { profileApi } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";

export interface AppNotification {
  id: string;
  type: "xp" | "badge" | "milestone" | "streak" | "reminder" | "tip";
  title: string;
  message: string;
  icon: string;
  timestamp: Date;
  read: boolean;
  actionPath?: string;
}

// Global notification store
let listeners: ((n: AppNotification[]) => void)[] = [];
let notifications: AppNotification[] = [];

// We now load notifications from the user's profile context.
// No fallback to local storage.

async function persistNotifications(notifs: AppNotification[]) {
  const list = notifs.slice(0, 50);
  try {
    await profileApi.update({ notifications: list });
  } catch (err) {
    console.error("Failed to save notifications", err);
  }
}

export function pushNotification(notif: Omit<AppNotification, "id" | "timestamp" | "read">) {
  const newNotif: AppNotification = {
    ...notif,
    id: crypto.randomUUID(),
    timestamp: new Date(),
    read: false,
  };
  notifications = [newNotif, ...notifications].slice(0, 50);
  persistNotifications(notifications);
  listeners.forEach(l => l([...notifications]));
}

// Notification triggers
export const NOTIFICATION_TRIGGERS = {
  taskComplete: (taskName: string, xp: number) =>
    pushNotification({ type: "xp", icon: "⚡", title: "Task Complete!", message: `You completed "${taskName}" and earned ${xp} XP` }),
  badgeUnlocked: (badgeName: string) =>
    pushNotification({ type: "badge", icon: "🏅", title: "Badge Unlocked!", message: `You earned the ${badgeName} badge` }),
  milestoneComplete: (title: string) =>
    pushNotification({ type: "milestone", icon: "🎉", title: "Milestone Complete!", message: `You finished "${title}" — amazing progress!` }),
  streakAlert: (days: number) =>
    pushNotification({ type: "streak", icon: "🔥", title: `${days}-Day Streak!`, message: `You've been consistent for ${days} days. Keep going!` }),
  studyReminder: () =>
    pushNotification({ type: "reminder", icon: "📚", title: "Daily Study Reminder", message: "Don't break your streak! Complete at least one task today" }),
  careerTip: (career: string) =>
    pushNotification({ type: "tip", icon: "💡", title: `Tip for ${career}`, message: `Focus on building projects related to ${career} for a stronger portfolio` }),
};

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function NotificationCenter() {
  const { profile, updateProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifs, setNotifs] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (profile && profile.notifications) {
      notifications = profile.notifications.map((n: { id: string; message: string; timestamp: string; read?: boolean }) => ({ ...n, timestamp: new Date(n.timestamp) }));
      setNotifs([...notifications]);
    }
  }, [profile]);

  useEffect(() => {
    const listener = (n: AppNotification[]) => {
      setNotifs([...n]);
      // Also update the context profile so it stays synced
      updateProfile({ notifications: n });
    };
    listeners.push(listener);
    return () => { listeners = listeners.filter(l => l !== listener); };
  }, [updateProfile]);

  const unreadCount = notifs.filter(n => !n.read).length;

  const markAllRead = useCallback(() => {
    notifications = notifications.map(n => ({ ...n, read: true }));
    persistNotifications(notifications);
    setNotifs([...notifications]);
  }, []);

  const markRead = useCallback((id: string) => {
    notifications = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    persistNotifications(notifications);
    setNotifs([...notifications]);
  }, []);

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(p => !p)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="relative text-muted-foreground hover:text-foreground transition-colors"
      >
        <Bell className="h-4 w-4" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="absolute top-8 right-0 z-50 w-[320px] max-h-[420px] rounded-xl border border-border bg-card shadow-2xl shadow-black/40 overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <span className="text-sm font-bold text-foreground">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                    Mark all read
                  </button>
                )}
              </div>

              <div className="overflow-y-auto max-h-[360px] scrollbar-hide">
                {notifs.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="text-3xl mb-2">🔔</div>
                    <p className="text-sm text-muted-foreground">No notifications yet</p>
                  </div>
                ) : (
                  notifs.map((notif, i) => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => markRead(notif.id)}
                      className={`flex gap-3 border-b border-border/50 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/30 ${
                        !notif.read ? "bg-primary/5" : ""
                      }`}
                    >
                      <span className="text-lg mt-0.5">{notif.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground">{notif.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                          {formatTimeAgo(notif.timestamp)}
                        </p>
                      </div>
                      {!notif.read && (
                        <div className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
