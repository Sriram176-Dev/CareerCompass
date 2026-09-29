import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface ShortcutHandlers {
  // Quiz handlers
  advanceScenario?: () => void;
  goBackScenario?: () => void;
  selectScenarioOption?: (index: number) => void;
  // Study handlers
  flipCard?: () => void;
  nextCard?: () => void;
  prevCard?: () => void;
  rateCard?: (difficulty: "easy" | "medium" | "hard") => void;
  isStudyMode?: boolean;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers = {}) {
  const location = useLocation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.matches("input, textarea, select, [contenteditable]");

      // Global: "/" to focus search
      if (e.key === "/" && !isInput) {
        const searchEl = document.querySelector("[data-search]") as HTMLElement;
        if (searchEl) {
          e.preventDefault();
          searchEl.focus();
        }
      }

      // Global: Escape to blur
      if (e.key === "Escape") {
        (document.activeElement as HTMLElement)?.blur?.();
      }

      // Quiz shortcuts
      if (location.pathname === "/quiz" && !isInput) {
        if (e.key === "ArrowRight" && handlers.advanceScenario) {
          e.preventDefault();
          handlers.advanceScenario();
        }
        if (e.key === "ArrowLeft" && handlers.goBackScenario) {
          e.preventDefault();
          handlers.goBackScenario();
        }
        if (["1", "2", "3", "4"].includes(e.key) && handlers.selectScenarioOption) {
          e.preventDefault();
          handlers.selectScenarioOption(parseInt(e.key) - 1);
        }
      }

      // Study shortcuts
      if (location.pathname === "/study" && handlers.isStudyMode && !isInput) {
        if ((e.key === " " || e.key === "Enter") && handlers.flipCard) {
          e.preventDefault();
          handlers.flipCard();
        }
        if (e.key === "ArrowRight" && handlers.nextCard) {
          e.preventDefault();
          handlers.nextCard();
        }
        if (e.key === "ArrowLeft" && handlers.prevCard) {
          e.preventDefault();
          handlers.prevCard();
        }
        if (e.key === "1" && handlers.rateCard) {
          e.preventDefault();
          handlers.rateCard("hard");
        }
        if (e.key === "2" && handlers.rateCard) {
          e.preventDefault();
          handlers.rateCard("medium");
        }
        if (e.key === "3" && handlers.rateCard) {
          e.preventDefault();
          handlers.rateCard("easy");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [location.pathname, handlers]);
}
