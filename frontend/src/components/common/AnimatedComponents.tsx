import { useState, useEffect, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ANIMATION_CONFIG } from "@/lib/animations";

// ========== ANIMATED NUMBER (count up on scroll into view) ==========
export function AnimatedNumber({ value, duration = 1.2, className }: { value: number; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const end = value;
    const increment = end / (duration * 60);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) { setDisplay(end); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [isInView, value, duration]);

  return <span ref={ref} className={className}>{display}</span>;
}

// ========== PROGRESS RING (SVG circle animation) ==========
export function ProgressRing({ percentage, size = 80, strokeWidth = 6, className }: { percentage: number; size?: number; strokeWidth?: number; className?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg width={size} height={size} className={className}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke="hsl(var(--primary))" strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: circumference - (percentage / 100) * circumference }}
        transition={{ duration: 1.2, ease: [0, 0, 0.2, 1] }}
        style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
      />
    </svg>
  );
}

// ========== POMODORO TIMER RING ==========
export function TimerRing({ timeLeft, totalTime, size = 80, strokeWidth = 4 }: { timeLeft: number; totalTime: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft / totalTime;

  return (
    <svg width={size} height={size} className="mx-auto">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke="hsl(var(--primary))" strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference - progress * circumference}
        style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dashoffset 1s linear" }}
      />
    </svg>
  );
}

// ========== XP FLOAT (flies upward on earn) ==========
export function XpFloat({ xp, onDone }: { xp: number; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 1200); return () => clearTimeout(t); }, [onDone]);
  return (
    <motion.span
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 0, y: -40 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      className="absolute -top-2 right-2 text-sm font-bold text-primary pointer-events-none z-10"
    >
      +{xp} XP
    </motion.span>
  );
}

// ========== ANIMATED CHECKMARK (SVG pathLength) ==========
export function AnimatedCheck({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <motion.circle cx="12" cy="12" r="10" stroke="hsl(var(--success))" strokeWidth="2" fill="hsl(var(--success) / 0.15)"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3 }} />
      <motion.path d="M8 12l3 3 5-5" stroke="hsl(var(--success))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, delay: 0.2 }} />
    </svg>
  );
}

// ========== RIPPLE BUTTON ==========
interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}
export function RippleButton({ children, onClick, className, ...props }: RippleButtonProps) {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ripple = { id: Date.now(), x: e.clientX - rect.left, y: e.clientY - rect.top };
    setRipples(prev => [...prev, ripple]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== ripple.id)), 600);
    onClick?.(e);
  };

  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={handleClick}
      className={`relative overflow-hidden ${className}`}
      {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {ripples.map(r => (
        <motion.span
          key={r.id}
          initial={{ width: 0, height: 0, opacity: 0.5 }}
          animate={{ width: 200, height: 200, opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute rounded-full bg-current opacity-20 pointer-events-none"
          style={{ left: r.x - 100, top: r.y - 100 }}
        />
      ))}
      {children}
    </motion.button>
  );
}

// ========== HAMBURGER ICON ==========
export function HamburgerIcon({ isOpen, className }: { isOpen: boolean; className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-[5px] w-5 h-5 ${className}`}>
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="block w-full h-[2px] bg-foreground rounded-full"
          animate={isOpen ? (
            i === 0 ? { rotate: 45, y: 7 } :
            i === 1 ? { opacity: 0, scaleX: 0 } :
            { rotate: -45, y: -7 }
          ) : { rotate: 0, y: 0, opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.25 }}
        />
      ))}
    </div>
  );
}

// ========== LEVEL UP MODAL ==========
export function LevelUpModal({ level, onClose }: { level: number; onClose: () => void }) {
  useEffect(() => {
    // Use the custom confetti from useBadges
    import("@/hooks/useBadges").then(mod => mod.useBadges && undefined);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        onClick={e => e.stopPropagation()}
        className="glass-card text-center max-w-xs mx-4"
      >
        <motion.span
          animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.8, repeat: 2 }}
          className="text-5xl block mb-4"
        >
          🎉
        </motion.span>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-extrabold text-primary"
        >
          Level {level}!
        </motion.p>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-sm text-text-secondary mt-2"
        >
          You've unlocked new achievements
        </motion.p>
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          className="btn-primary mt-6"
        >
          Keep going! 🚀
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ========== MOBILE NAV MENU ==========
export function MobileMenu({ isOpen, onClose, links }: { isOpen: boolean; onClose: () => void; links: { path: string; label: string }[] }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="fixed top-[52px] left-0 right-0 z-50 border-b border-border bg-card p-4"
          >
            {links.map((link, i) => (
              <motion.a
                key={link.path}
                href={link.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={onClose}
                className="block py-3 px-4 text-sm text-foreground hover:text-primary transition-colors rounded-lg hover:bg-muted"
              >
                {link.label}
              </motion.a>
            ))}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
