import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TOUR_STEPS = [
  {
    target: '[data-tour="interest-cards"]',
    title: "Start Here 👋",
    description: "Select cards that match your interests. The more you pick, the better your matches!",
    position: "bottom" as const,
  },
  {
    target: '[data-tour="live-preview"]',
    title: "Watch Your Matches Update 🎯",
    description: "See your top career matches update in real-time as you click cards",
    position: "top" as const,
  },
  {
    target: '[data-tour="scenario-tab"]',
    title: "Answer Life Scenarios 🎭",
    description: "10 real-life questions that reveal your true work personality",
    position: "bottom" as const,
  },
  {
    target: '[data-tour="analyze-btn"]',
    title: "Discover Your Path 🚀",
    description: "Our AI analyzes 300+ careers to find your perfect match",
    position: "top" as const,
  },
];

export default function WelcomeTour() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const hasSeen = localStorage.getItem("hasSeenWelcome");
    if (!hasSeen) {
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const updateTargetRect = useCallback(() => {
    const el = document.querySelector(TOUR_STEPS[step].target);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    } else {
      setTargetRect(null);
    }
  }, [step]);

  useEffect(() => {
    if (!visible) return;
    updateTargetRect();
    window.addEventListener("resize", updateTargetRect);
    window.addEventListener("scroll", updateTargetRect, true);
    return () => {
      window.removeEventListener("resize", updateTargetRect);
      window.removeEventListener("scroll", updateTargetRect, true);
    };
  }, [visible, updateTargetRect]);

  const dismiss = () => {
    localStorage.setItem("hasSeenWelcome", "true");
    setVisible(false);
  };

  const next = () => {
    if (step < TOUR_STEPS.length - 1) setStep(s => s + 1);
    else dismiss();
  };

  const back = () => {
    if (step > 0) setStep(s => s - 1);
  };

  if (!visible) return null;

  const current = TOUR_STEPS[step];
  const padding = 8;

  // Tooltip position
  const tooltipStyle: React.CSSProperties = {
    position: "fixed",
    zIndex: 10001,
    maxWidth: 320,
  };

  if (targetRect) {
    if (current.position === "bottom") {
      tooltipStyle.top = targetRect.bottom + 12;
      tooltipStyle.left = Math.max(16, Math.min(targetRect.left, window.innerWidth - 336));
    } else {
      tooltipStyle.bottom = window.innerHeight - targetRect.top + 12;
      tooltipStyle.left = Math.max(16, Math.min(targetRect.left, window.innerWidth - 336));
    }
  } else {
    tooltipStyle.top = "50%";
    tooltipStyle.left = "50%";
    tooltipStyle.transform = "translate(-50%, -50%)";
  }

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Overlay with spotlight cutout */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000]"
            style={{ pointerEvents: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
              <defs>
                <mask id="spotlight-mask">
                  <rect x="0" y="0" width="100%" height="100%" fill="white" />
                  {targetRect && (
                    <rect
                      x={targetRect.left - padding}
                      y={targetRect.top - padding}
                      width={targetRect.width + padding * 2}
                      height={targetRect.height + padding * 2}
                      rx="12"
                      fill="black"
                    />
                  )}
                </mask>
              </defs>
              <rect
                x="0" y="0" width="100%" height="100%"
                fill="rgba(0,0,0,0.7)"
                mask="url(#spotlight-mask)"
              />
            </svg>

            {/* Spotlight border glow */}
            {targetRect && (
              <motion.div
                animate={{ boxShadow: ["0 0 0 2px hsl(var(--primary) / 0.4)", "0 0 0 4px hsl(var(--primary) / 0.2)", "0 0 0 2px hsl(var(--primary) / 0.4)"] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute rounded-xl"
                style={{
                  left: targetRect.left - padding,
                  top: targetRect.top - padding,
                  width: targetRect.width + padding * 2,
                  height: targetRect.height + padding * 2,
                  pointerEvents: "none",
                }}
              />
            )}
          </motion.div>

          {/* Tooltip */}
          <motion.div
            key={step}
            initial={{ opacity: 0, y: current.position === "bottom" ? -10 : 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            style={tooltipStyle}
            className="rounded-xl border border-border bg-card p-5 shadow-2xl shadow-black/40"
          >
            {/* Step indicator */}
            <div className="mb-3 flex gap-1.5">
              {TOUR_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === step ? "w-6 bg-primary" : i < step ? "w-3 bg-primary/50" : "w-3 bg-muted"
                  }`}
                />
              ))}
            </div>

            <h3 className="text-base font-bold text-foreground">{current.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{current.description}</p>

            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={dismiss}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip tour
              </button>
              <div className="flex gap-2">
                {step > 0 && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={back}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    Back
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={next}
                  className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground"
                >
                  {step === TOUR_STEPS.length - 1 ? "Got it! Let's go →" : "Next"}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
