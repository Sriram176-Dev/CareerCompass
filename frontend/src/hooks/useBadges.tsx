import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

export interface BadgeDefinition {
  id: string;
  name: string;
  icon: string;
  description: string;
  condition: (xp: number, tasks: number, level: number) => boolean;
}

const BADGE_DEFINITIONS: BadgeDefinition[] = [
  { id: "first_steps", name: "First Steps 🌱", icon: "🌱", description: "Complete your first task", condition: (_, tasks) => tasks >= 1 },
  { id: "on_fire", name: "On Fire 🔥", icon: "🔥", description: "Earn 100 XP", condition: (xp) => xp >= 100 },
  { id: "rising_star", name: "Rising Star ⭐", icon: "⭐", description: "Earn 500 XP", condition: (xp) => xp >= 500 },
  { id: "diamond", name: "Diamond 💎", icon: "💎", description: "Earn 1000 XP", condition: (xp) => xp >= 1000 },
  { id: "sharpshooter", name: "Sharpshooter 🎯", icon: "🎯", description: "Complete 10 tasks", condition: (_, tasks) => tasks >= 10 },
  { id: "scholar", name: "Scholar 📚", icon: "📚", description: "Complete 25 tasks", condition: (_, tasks) => tasks >= 25 },
  { id: "champion", name: "Champion 🏆", icon: "🏆", description: "Reach level 10", condition: (_, __, level) => level >= 10 },
  { id: "legend", name: "Legend 🌟", icon: "🌟", description: "Earn 5000 XP", condition: (xp) => xp >= 5000 },
];

function fireConfetti() {
  const colors = ["#4F9EFF", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:99999";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d")!;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles: { x: number; y: number; vx: number; vy: number; color: string; size: number; life: number }[] = [];
  for (let i = 0; i < 120; i++) {
    particles.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 200,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 15,
      vy: Math.random() * -18 - 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 6 + 3,
      life: 1,
    });
  }

  let frame = 0;
  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.4;
      p.life -= 0.012;
      if (p.life <= 0) return;
      alive = true;
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size * 0.6);
    });
    frame++;
    if (alive && frame < 180) requestAnimationFrame(animate);
    else document.body.removeChild(canvas);
  };
  requestAnimationFrame(animate);
}

export function useBadges() {
  const { profile, updateProfile } = useAuth();
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const checkedRef = useRef(false);

  useEffect(() => {
    if (profile?.completed_tasks) {
      // Load previously earned badges from completed_tasks metadata or infer
      const badges: string[] = [];
      const xp = profile.xp || 0;
      const tasks = (profile.completed_tasks || []).length;
      const level = profile.level || 1;
      BADGE_DEFINITIONS.forEach(b => {
        if (b.condition(xp, tasks, level)) badges.push(b.id);
      });
      setEarnedBadges(badges);
    }
  }, [profile?.xp, profile?.level, profile?.completed_tasks]);

  const checkBadges = useCallback(() => {
    if (!profile) return;
    const xp = profile.xp || 0;
    const tasks = (profile.completed_tasks || []).length;
    const level = profile.level || 1;

    BADGE_DEFINITIONS.forEach(badge => {
      if (badge.condition(xp, tasks, level) && !earnedBadges.includes(badge.id)) {
        setEarnedBadges(prev => [...prev, badge.id]);
        fireConfetti();
        toast.success(`${badge.name} badge earned! 🏅`, { duration: 5000 });
      }
    });
  }, [profile, earnedBadges]);

  return { earnedBadges, checkBadges, allBadges: BADGE_DEFINITIONS, fireConfetti };
}
