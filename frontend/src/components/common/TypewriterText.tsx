import { useState, useEffect } from "react";

interface TypewriterTextProps {
  texts: string[];
  speed?: number;
  pauseTime?: number;
  className?: string;
}

export default function TypewriterText({ texts, speed = 50, pauseTime = 2000, className }: TypewriterTextProps) {
  const [displayText, setDisplayText] = useState("");
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = texts[textIndex];
    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          if (charIndex < current.length) {
            setDisplayText(current.slice(0, charIndex + 1));
            setCharIndex((c) => c + 1);
          } else {
            setTimeout(() => setIsDeleting(true), pauseTime);
          }
        } else {
          if (charIndex > 0) {
            setDisplayText(current.slice(0, charIndex - 1));
            setCharIndex((c) => c - 1);
          } else {
            setIsDeleting(false);
            setTextIndex((t) => (t + 1) % texts.length);
          }
        }
      },
      isDeleting ? speed / 2 : speed
    );
    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, textIndex, texts, speed, pauseTime]);

  return (
    <span className={className}>
      {displayText}
      <span className="animate-pulse text-primary">|</span>
    </span>
  );
}
