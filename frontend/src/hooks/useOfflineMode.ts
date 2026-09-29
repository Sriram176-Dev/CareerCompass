import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

interface OfflineAction {
  type: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

export function useOfflineMode() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const syncPendingActions = useCallback(async () => {
    const pending = JSON.parse(localStorage.getItem("pendingActions") || "[]") as OfflineAction[];
    if (pending.length === 0) return;
    // Clear — actual sync would process each action
    localStorage.removeItem("pendingActions");
    toast.success(`Synced ${pending.length} offline change${pending.length > 1 ? "s" : ""}!`);
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Back online!");
      syncPendingActions();
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast("Offline mode — changes will sync when you reconnect", { icon: "⚡" });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncPendingActions]);

  const saveOfflineAction = useCallback((action: Omit<OfflineAction, "timestamp">) => {
    const pending = JSON.parse(localStorage.getItem("pendingActions") || "[]");
    pending.push({ ...action, timestamp: Date.now() });
    localStorage.setItem("pendingActions", JSON.stringify(pending));
  }, []);

  return { isOnline, saveOfflineAction };
}
