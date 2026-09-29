import { motion, AnimatePresence } from "framer-motion";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Download, X } from "lucide-react";

export default function PWAInstallBanner() {
  const { canInstall, install, dismiss } = usePWAInstall();

  return (
    <AnimatePresence>
      {canInstall && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-sm rounded-xl border border-border bg-card p-4 shadow-xl shadow-black/30"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              <Download className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">Install AI Career Compass</p>
              <p className="text-xs text-muted-foreground mt-0.5">Access offline, faster loading, just like an app</p>
              <div className="flex gap-2 mt-3">
                <button onClick={install} className="btn-primary text-xs px-4 py-1.5">
                  Install App
                </button>
                <button onClick={dismiss} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Not now
                </button>
              </div>
            </div>
            <button onClick={dismiss} className="text-muted-foreground hover:text-foreground shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
