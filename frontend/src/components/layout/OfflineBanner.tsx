import { motion, AnimatePresence } from "framer-motion";
import { useOfflineMode } from "@/hooks/useOfflineMode";

export default function OfflineBanner() {
  const { isOnline } = useOfflineMode();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -40 }}
          animate={{ y: 0 }}
          exit={{ y: -40 }}
          className="fixed top-[52px] left-0 right-0 z-[97] bg-warning text-warning-foreground px-4 py-2 text-center text-xs font-semibold"
        >
          ⚡ Offline mode — your progress is saved locally and will sync when you reconnect
        </motion.div>
      )}
    </AnimatePresence>
  );
}
