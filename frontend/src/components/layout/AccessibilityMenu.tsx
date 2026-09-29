import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Accessibility } from "lucide-react";

export default function AccessibilityMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [fontSize, setFontSize] = useState(() => {
    return parseInt(localStorage.getItem("a11y-font-size") || "16");
  });

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
    localStorage.setItem("a11y-font-size", String(fontSize));
  }, [fontSize]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <motion.button
        onClick={() => setIsOpen(p => !p)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-card border border-border shadow-lg text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Accessibility options"
      >
        <Accessibility className="h-4 w-4" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="absolute bottom-12 right-0 rounded-xl border border-border bg-card p-3 shadow-xl w-[180px]"
            role="menu"
            aria-label="Accessibility options"
          >
            <p className="text-xs font-semibold text-foreground mb-2">Font Size</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFontSize(s => Math.max(s - 2, 12))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-sm font-bold text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
                aria-label="Decrease font size"
              >
                A-
              </button>
              <span className="flex-1 text-center text-xs text-muted-foreground">{fontSize}px</span>
              <button
                onClick={() => setFontSize(s => Math.min(s + 2, 24))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-sm font-bold text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
                aria-label="Increase font size"
              >
                A+
              </button>
            </div>
            <button
              onClick={() => setFontSize(16)}
              className="mt-2 w-full rounded-lg border border-border px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Reset to default
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
