import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import toast from "react-hot-toast";

const SEQUENCE = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];

export function useKonamiCode(onTrigger?: () => void) {
  const keysRef = useRef<string[]>([]);
  const triggeredRef = useRef(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      keysRef.current = [...keysRef.current, e.key].slice(-SEQUENCE.length);
      if (
        !triggeredRef.current &&
        JSON.stringify(keysRef.current) === JSON.stringify(SEQUENCE)
      ) {
        triggeredRef.current = true;
        confetti({ particleCount: 300, spread: 180, origin: { y: 0.4 } });
        toast.success("🎉 You found the secret! +100 XP bonus!");
        onTrigger?.();
        // Reset after 5s so it can be triggered again
        setTimeout(() => { triggeredRef.current = false; }, 5000);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onTrigger]);
}
