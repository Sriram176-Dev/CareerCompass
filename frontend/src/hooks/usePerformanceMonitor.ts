import { useEffect } from "react";

export function usePerformanceMonitor() {
  useEffect(() => {
    // Track page load time
    try {
      const entries = performance.getEntriesByType("navigation");
      if (entries.length > 0) {
        const nav = entries[0] as PerformanceNavigationTiming;
        const loadTime = nav.loadEventEnd - nav.startTime;
        if (loadTime > 3000) console.warn(`[Perf] Slow page load: ${Math.round(loadTime)}ms`);
      }
    } catch { /* ignore */ }

    // Track long tasks
    if ("PerformanceObserver" in window) {
      try {
        const observer = new PerformanceObserver(list => {
          list.getEntries().forEach(entry => {
            if (entry.duration > 100) {
              console.warn(`[Perf] Long task: ${Math.round(entry.duration)}ms`);
            }
          });
        });
        observer.observe({ entryTypes: ["longtask"] });
        return () => observer.disconnect();
      } catch { /* longtask not supported */ }
    }
  }, []);
}
